# Echo Chamber Media — QR Code (3D Print)

**Points to:** `https://echochambermedia.com/links`
**Error correction:** Level H (~30% redundancy — survives smudges, layer artifacts, uneven light)

## Files

| File | Use |
|------|-----|
| `echochamber-links-qr-3dprint.stl` | Drop into your slicer (Orca / FlashPrint / PrusaSlicer / Bambu Studio). Ready to print. |
| `echochamber-links-qr.svg` | Vector. For CAD (Fusion, TinkerCAD, Blender) or the website. |
| `echochamber-links-qr.png` | Raster. For stickers, business cards, web. |
| `echochamber-links-qr-preview.png` | Reference render of how the finished print will look. |

## Physical Dimensions

- Tile: **80 × 80 × 3.2 mm**
- Base plate: 2.0 mm
- Raised QR modules: 1.2 mm (rise above base)
- Quiet-zone border: 6 mm on all sides
- QR grid: 33 × 33 modules @ 2.06 mm per module
- Estimated weight in PLA: ~19 g

## Recommended Slicer Settings (Flashforge Adventurer 5M Pro)

Works in **Orca Slicer** (with the 5M Pro profile) or **FlashPrint 5**.

| Setting | Value |
|---------|-------|
| Nozzle | 0.4 mm (stock) |
| Layer height | **0.2 mm** |
| First layer height | 0.2 mm |
| Wall loops | 3 |
| Top layers | 5 |
| Bottom layers | 4 |
| Infill | 15% gyroid (doesn't matter much, it's thin) |
| Print speed | 150 mm/s (stock profile is fine) |
| Build plate | PEI or textured PEI, no brim needed |
| Orientation | Flat on the bed, QR face **up** |

## The Two-Color Filament Swap (This Is the Important Part)

The Adventurer 5M Pro has a single extruder, so you'll swap filament mid-print.

### Color plan
- **Color A (base + border):** prints layers 1–10. Suggested: Echo Chamber gold (`#D4AF37`-ish) or matte off-white.
- **Color B (QR squares):** prints layers 11–16. Suggested: matte black.

### In Orca Slicer
1. Load the STL. Confirm the tile sits flat on the bed and Z-height shows 3.2 mm.
2. Slice it.
3. Open the **preview** and scrub to **layer 11** (Z = 2.0 mm, the exact moment the raised QR squares begin).
4. Right-click that layer → **Add Pause** (or "Change Filament").
5. Re-slice and export G-code.
6. Start print with Color A loaded.
7. When the printer pauses, unload Color A, load Color B, resume.

### In FlashPrint 5
1. Load the STL.
2. Go to **Edit → Advanced → Pause at Layer** (or "Insert Pause").
3. Pause at **layer 11**.
4. Export `.3mf` / `.gcode` and print.
5. Follow the pause → swap → resume flow above.

### If your slicer uses Z-height instead of layer number
Pause at **Z = 2.0 mm**.

## Scan Sanity Check

Before printing: scan `echochamber-links-qr-preview.png` with your phone. It should open the `/links` page. (Already verified by me — decoded cleanly with OpenCV.)

After printing: scan the physical tile under normal room light. Phones with iOS 17+ or Android 13+ native cameras will read it at arm's length. If contrast is low, tilt the tile 10–15° to catch a shadow in the raised squares — this is why the two-color contrast is important.

## Troubleshooting

- **Phone won't scan the print:** Color B is too close to Color A in value (e.g., gray-on-white). Reprint with higher contrast. Black-on-gold or black-on-white is the reliable combo.
- **Raised squares look mushy:** First layer of Color B is over-extruding. Lower flow to 95% for layers 11–16, or increase cooling fan to 100%.
- **Squares have stringing between them:** Enable "wipe while retracting" and bump retraction to 1.0 mm.
- **Want it bigger / smaller:** Scale uniformly in your slicer. Below 60 mm tile size, phone cameras start struggling in low light.

## Regenerating or Customizing

The Python script that built all of this lives at `outputs/make_qr.py` in the session. To change the URL, tile size, or layer heights, edit the constants at the top and re-run.

---

# Styled Poster 3D Print (`echochamber-qr-poster-3dprint.stl`)

This is the full **branded poster** as a 3D-printable plaque — "ECHO CHAMBER / MEDIA" header, gold frame, styled rounded-module QR, "SCAN TO CONNECT", and the URL — all rendered as raised relief on top of a base plate.

## Physical Dimensions

- Plate: **150 × 205 × 3 mm** (fits the 5M Pro's 220×220 bed easily)
- Base plate: 2.0 mm (Color A)
- Raised relief: 1.0 mm (Color B)
- Estimated print time @ 0.2mm / 150 mm/s: ~2.5–3.5 hours
- Estimated filament: ~35–50 g PLA total

## The Color Plan

This is a **2-color filament-swap print** on your single-extruder 5M Pro. One pause at one layer. That's it.

- **Color A — Base (layers 1–10):** anything dark reads well. Black, charcoal, matte gray. This is the background "canvas" of the poster.
- **Color B — Relief (layers 11–15):** gold is the brand color (`#C9A84C`-ish — Polymaker Silk Gold or eSUN Silk Gold both look great). White works too if you want high-contrast.

## Orca Slicer Setup (Flashforge Adventurer 5M Pro)

1. **Open Orca Slicer.** Make sure the "Flashforge Adventurer 5M Pro" printer profile is selected.
2. **Load** `echochamber-qr-poster-3dprint.stl`. It should appear flat on the bed, 150 × 205 mm, reading face-up.
3. **Filament:** load Color A (base color). Doesn't matter what you say Color B is in Orca — we're doing the swap manually.
4. **Slice settings:**
   - Layer height: **0.2 mm**
   - Walls: 3
   - Top/bottom layers: 4
   - Infill: 15% (doesn't matter much, the plate is only 2 mm thick)
   - First-layer speed: 30 mm/s (good first-layer adhesion is critical for a large flat print)
   - Print speed: 150 mm/s (stock)
   - No supports. No brim needed.
5. **Slice it.** Open the **Preview** tab.
6. Scrub the layer slider to **layer 11** (Z = 2.0 mm). This is the first layer of the raised relief. Right-click → **Add Pause** (or "Change Filament").
7. Re-slice. Export G-code.

## During the Print

1. Start the print with Color A loaded. First 10 layers go down as a solid plate.
2. When the printer **pauses at layer 11**, it'll move the head aside. On the Adventurer 5M Pro:
   - Unload Color A (menu → Filament → Unload)
   - Load Color B
   - **Purge** until you see clean Color B coming out (~20–30mm of filament)
   - Wipe the nozzle tip with tweezers or a wire brush
   - Press **Resume** on the printer
3. Layers 11–15 deposit Color B as the raised relief.

## Design Notes

- **White text became gold.** The original poster mockup has "ECHO CHAMBER" and "SCAN TO CONNECT" in white, with "MEDIA" and the URL in gold. On a single-extruder print that's 3 colors = 2 swaps = a lot of failure risk. I merged them into one accent color so the whole relief prints in a single pass of Color B. If you really want the 3-color version, say so — we can split the STL into two raised layers for a second swap.
- **The tagline ("Links, reels, and the latest work") was dropped.** Its Montserrat Regular strokes at that size are ~0.3 mm wide — thinner than your 0.4 mm nozzle can resolve cleanly. Leaving it out keeps the print sharp.
- **QR uses error correction level H (30%).** The raised-gold-on-dark-base contrast is the single best combination for QR scanning.

## Post-Print Inspection

- Scan the printed tile with your phone under normal room light. Tilt 5–10° to catch a shadow in the raised modules if needed.
- If a stray blob of filament bridges two QR modules, pick it off with tweezers — stringing can block the scan at oblique angles.
- For a showroom-quality finish, light sand the base layer top (only where it's still Color A) with 400-grit to knock down the filament seam line before the Color B layer starts. (Optional — most prints look fine as-is.)

