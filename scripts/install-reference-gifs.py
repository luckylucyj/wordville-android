#!/usr/bin/env python3
"""Install the user's two GIFs: fishing and food collection. Never assign food to weeding."""
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ASSETS=Path(__file__).resolve().parents[1]/"app/src/main/assets"
ARCHIVE=ASSETS/"wordville-reference-gifs.zip"
NEEDED=("images/reference/fishing.gif","images/reference/foraging.gif")
LEGACY="images/reference/weeding.gif"  # Old ZIP mistakenly named a food GIF 'weeding'.

def main():
    if not ARCHIVE.exists():
        found=[(ASSETS/name).is_file() for name in NEEDED]
        if any(found) and not all(found):
            raise SystemExit("Include both original GIF images.")
        print("Reference GIFs present." if all(found)
              else "::notice::Optional GIFs absent. Offline PNG fallback remains enabled.")
        return
    try:
        with ZipFile(ARCHIVE) as z:
            names=set(z.namelist())
            if NEEDED[0] not in names or not({NEEDED[1],LEGACY}&names):
                raise ValueError("Missing fishing.gif or food-foraging.gif.")
            for target,source in [
                (NEEDED[0],NEEDED[0]),
                (NEEDED[1],NEEDED[1] if NEEDED[1] in names else LEGACY)]:
                item=z.getinfo(source)
                if item.is_dir() or not 1000<item.file_size<12000000:
                    raise ValueError("Bad GIF size: "+source)
                image=z.read(item)
                if image[:6] not in (b"GIF89a",b"GIF87a"):
                    raise ValueError("Invalid GIF header: "+source)
                dest=ASSETS/target
                dest.parent.mkdir(parents=True,exist_ok=True)
                dest.write_bytes(image)
    except (BadZipFile,ValueError) as exc:
        raise SystemExit("Invalid reference GIF package: "+str(exc)) from exc
    ARCHIVE.unlink()
    print("Installed original fishing and food-foraging GIFs.")

if __name__=="__main__":
    main()
