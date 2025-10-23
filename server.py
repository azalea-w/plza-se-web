import asyncio
import io
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import List
from uuid import uuid4

import pydantic
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import StreamingResponse

from lib.plaza.crypto import SCBlock, SwishCrypto, HashDB
from lib.plaza.types import BagSave, CoreData, HashDBKeys, PokedexSaveDataAccessor
from lib.plaza.types.coredata import Gender
from lib.plaza.util import VALID_ITEMS, VALID_MONS
from lib.plaza.util.items import item_db

# Configuration
src_dir = Path(__file__).parent

# Global state
file_map: dict[str, HashDB] = {}
app = FastAPI(title="PLZA Save Editor")

# Load index.html
with open(src_dir / "dist" / "index.html") as f:
    index = f.read()

# noinspection PyTypeChecker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for IO-bound tasks
thread_pool = ThreadPoolExecutor(max_workers=10)

# Serve static files
app.mount("/dist", StaticFiles(directory=src_dir / "dist"), name="dist")

def obtain_hash_db(content: bytes) -> HashDB | None:
    try:
        decrypted = SwishCrypto.decrypt(content)
        return HashDB(decrypted)
    except ...:
        return None

def encrypt_hash_db(blocks: List[SCBlock]) -> bytes | None:
    try:
        return SwishCrypto.encrypt(blocks)
    except ...:
        return None

class ModifyRequest(pydantic.BaseModel):
    save_data_ref: str
    changes: dict[str, dict]

# noinspection PyTypeChecker
@app.post("/parse")
async def repair_save(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    loop = asyncio.get_event_loop()
    hash_db = await loop.run_in_executor(thread_pool, obtain_hash_db, content)

    if not hash_db:
        return HTTPException(status_code=400, detail="Not a PLZA Save File")

    core_data = CoreData.from_bytes(hash_db[HashDBKeys.CoreData].data)
    core_data_object = {
        "name": core_data.get_name_string(),
        "gender": core_data.get_gender(),
        "tid": core_data.id,
        "language": core_data.poke_language_id
    }

    bag_data = BagSave.from_bytes(hash_db[HashDBKeys.BagSave].data)
    bag_data_object = {
        "entries": {i: {"category": entry.category, "quantity": entry.quantity}
            for i, entry in enumerate(bag_data.entries)
            if i in VALID_ITEMS
        }
    }

    dex_data = PokedexSaveDataAccessor.from_bytes(hash_db[HashDBKeys.PokeDex].data)
    dex_data_object = {
        "entries": {i: {
            "capture_flag": entry.capture_flg,
            "battle_flag": entry.battle_flg,
            "shiny_flag": entry.rare_flg,
            "mega_flag": entry.mg_flg
        }
            for i, entry in enumerate(dex_data.data.pokedex_data)
            if i in VALID_MONS
        }
    }

    ref_id = str(uuid4())
    file_map[ref_id] = hash_db

    try:
        return {
            "ref_id": ref_id,
            "success": True,
            "bag": bag_data_object,
            "core": core_data_object,
            "dex": dex_data_object
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        ...

@app.post("/modify")
async def modify_save(body: ModifyRequest):
    print(body.save_data_ref, file_map.keys())
    if body.save_data_ref not in file_map:
        raise HTTPException(status_code=404, detail="Save not found")

    core_changes = body.changes.get("core", {})
    bag_changes = body.changes.get("bag", {})

    hash_db = file_map[body.save_data_ref]

    core_data = CoreData.from_bytes(hash_db[HashDBKeys.CoreData].data)
    bag_save = BagSave.from_bytes(hash_db[HashDBKeys.BagSave].data)

    if "gender" in core_changes:
        core_data.set_gender(Gender(core_changes["gender"]))
        if core_changes["gender"] == 0:
            data_path = src_dir / "valid_blocks" / "dressup_male_data.bin"
        else:
            data_path = src_dir / "valid_blocks" / "dressup_female_data.bin"

        with open(data_path, "rb") as _f: hash_db[HashDBKeys.DressUp].change_data(_f.read())

    if "name" in core_changes:
        core_data.set_name_string(core_changes["name"] or ".")

    if "tid" in core_changes:
        core_data.id = int(core_changes["tid"]) & 0xFFFFFFFF

    if "language" in core_changes:
        core_data.poke_language_id = core_changes["language"]

    if core_changes:
        hash_db[HashDBKeys.CoreData].change_data(core_data.to_bytes())

    for bag_change in bag_changes:
        _id = bag_change.removeprefix("bag_")
        if int(_id) not in VALID_ITEMS: continue
        current_entry = bag_save.get_entry(int(_id))
        current_entry.category = item_db[int(_id)]["expected_category"]
        current_entry.quantity = max(min(bag_changes[bag_change], 999), 0)
        bag_save.set_entry(int(_id), current_entry)

    if bag_changes:
        hash_db[HashDBKeys.BagSave].change_data(bag_save.to_bytes())

    file_map[body.save_data_ref] = hash_db

    return {
        "success": True,
        "download_url": f"/download/{body.save_data_ref}"
    }

@app.get("/download/{save_id}")
async def download_file(save_id: str):
    hash_db = file_map.get(save_id)

    if not hash_db:
        raise HTTPException(status_code=404, detail="File not found")

    loop = asyncio.get_event_loop()
    buffer = await loop.run_in_executor(thread_pool, encrypt_hash_db, hash_db.blocks)

    return StreamingResponse(
        io.BytesIO(buffer),
        media_type='application/octet-stream',
        headers={"Content-Disposition": "attachment; filename=main"}
    )


@app.get("/", response_class=HTMLResponse)
async def main():
    return HTMLResponse(index, 200)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
