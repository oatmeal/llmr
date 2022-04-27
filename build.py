from pathlib import Path
import json
import shutil
import subprocess

# reset deploy/
if Path('deploy/').exists():
    shutil.rmtree('deploy/')
shutil.copytree('static', 'deploy')
shutil.copytree('tiles', 'deploy/tiles')

process = subprocess.run([
        'npx', 'terser', 'lib/map.js', '-c',
        '-o', 'deploy/map.js'
    ])
if process.returncode != 0:
    print('could not run terser; did you run `npm i`?')
    exit(1)

shutil.copy('node_modules/leaflet/dist/leaflet.js', 'deploy')
shutil.copy('node_modules/leaflet/dist/leaflet.css', 'deploy')
shutil.copytree('node_modules/leaflet/dist/images', 'deploy/images')

shutil.copy('node_modules/leaflet.tilelayer.fallback/dist/leaflet.tilelayer.fallback.js', 'deploy')

shutil.copy('node_modules/leaflet-sidebar-v2/css/leaflet-sidebar.min.css', 'deploy')
shutil.copy('node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.min.js', 'deploy')

p = Path('tiles/')
layer_ids = dict()

for dimension in ['overworld', 'nether', 'end']:
    # Minecraft coords of upper right hand corner of the zoom level 4 tile designated as [0, 0]
    X0 = 0
    Z0 = 0
    if dimension == 'overworld':
        X0 = 6080
        Z0 = -64
        default_X = 6620
        default_Z = 605
        default_zoom = 4
        tile_path = 'tiles/overworld'
        error_tile_url = 'tiles/overworld.png'
        tile_size = 256
    if dimension == 'nether':
        X0 = 6080
        Z0 = -64
        default_X = 6588 # 831
        default_Z = 544 # 70
        default_zoom = 1
        # nether shows (transparent) overworld tiles at a lower zoom
        tile_path = 'tiles/overworld'
        error_tile_url = 'tiles/nether.png'
        tile_size = 256
    if dimension == 'end':
        X0 = -64
        Z0 = -64
        default_X = 0
        default_Z = 0
        default_zoom = 4
        tile_path = 'tiles/end'
        error_tile_url = 'tiles/end.png'
        tile_size = 256

    Path('deploy/data/' + dimension).mkdir(parents=True)

    time_file_dict = {}
    dates = set()
    min_zoom = 99
    max_zoom = -99
    min_X = 1e8
    max_X = -1e8
    min_Z = 1e8
    max_Z = -1e8
    file_coords_dict = {}
    dim_tile_path = 'end' if dimension == 'end' else 'overworld'
    for fn in p.glob(dim_tile_path+'/**/*.png'):
        fp = fn.parts
        # print(fp)
        if len(fp) == 6:
            if dimension != 'nether':
                # print(fp)
                # dimension = fn.parts[1]
                key = '/'.join(fn.parts[2:5])
                # print(key)
                date = fn.stem
                # print(date)
                if key not in file_coords_dict:
                    file_coords_dict[(int(fn.parts[2]), int(fn.parts[3]), int(fn.parts[4]))] = key
                if key not in time_file_dict:
                    time_file_dict[key] = []
                time_file_dict[key].append(date)
                dates.add(date)

            zoom = int(fn.parts[2])
            x = int(fn.parts[3])
            z = int(fn.parts[4])

            if zoom < min_zoom:
                min_zoom = zoom
            if zoom > max_zoom:
                max_zoom = zoom

            # compute bounds & update min / max zoom
            width = 2 ** (11 - zoom)

            min_X_tile = width * x + X0
            min_Z_tile = width * z + Z0
            max_X_tile = min_X_tile + width - 1
            max_Z_tile = min_Z_tile + width - 1

            if min_X_tile < min_X:
                min_X = min_X_tile
            if max_X_tile > max_X:
                max_X = max_X_tile
            if min_Z_tile < min_Z:
                min_Z = min_Z_tile
            if max_Z_tile > max_Z:
                max_Z = max_Z_tile

    layers = []
    for fn in Path('.').glob('data/' + dimension + '/*.json'):
        outfn = 'deploy/data/' + dimension + '/' + fn.name
        with open(fn, 'r') as infile, open(outfn, 'w') as outfile:
            over = json.load(infile)
            if 'id' not in over:
                print(fn, 'is missing `id`')
                exit(1)
            if over['id'] in layer_ids:
                print(fn, 'and', layer_ids[over['id']], 'have duplicate `id`s')
                exit(1)
            layer_ids[over['id']] = fn
            layers.append({
                "id": over['id'],
                "name": over['name'],
                "url": 'data/' + dimension + '/' + fn.name,
            })

            if 'markers' in over:
                for d in over['markers']:
                    X_marker = d['pos'][0]
                    Z_marker = d['pos'][2]
                    if dimension == 'nether':
                        X_marker = 8 * X_marker
                        Z_marker = 8 * Z_marker
                    if X_marker < min_X:
                        min_X = X_marker
                    if X_marker > max_X:
                        max_X = X_marker
                    if Z_marker < min_Z:
                        min_Z = Z_marker
                    if Z_marker > max_Z:
                        max_Z = Z_marker

            # process polylines
            if 'lines' in over:
                for line in over['lines']:
                    for d in line['pts']:
                        X_marker = d[0]
                        Z_marker = d[2]
                        if dimension == 'nether':
                            X_marker = 8 * X_marker
                            Z_marker = 8 * Z_marker
                        if X_marker < min_X:
                            min_X = X_marker
                        if X_marker > max_X:
                            max_X = X_marker
                        if Z_marker < min_Z:
                            min_Z = Z_marker
                        if Z_marker > max_Z:
                            max_Z = Z_marker

            # write minified JSON
            json.dump(over, outfile, separators=(',', ':'), ensure_ascii=False)

    # the JS code also assumes this is sorted!
    for d in time_file_dict:
        time_file_dict[d] = sorted(time_file_dict[d])

    # print(dates)
    # loop over all dates for this dimension
    for date in dates:
        # loop over all 3 modes (exact, all before with fill, all before without fill)
        for mode in ['e', 'f', 'b']:
            tile_replacements_dict = {}
            skipped_tiles = {}
            # loop over all tiles
            for coords, key in file_coords_dict.items():
                key_dates = time_file_dict[key]
                # print(date,mode,coords,key,key_dates)
                # skip tile if it doesn't appear with the given mode / date
                if mode == 'e' and date not in key_dates:
                    continue
                if mode == 'b' and date < min(key_dates):
                    continue
                # calculate date to use
                # const date = timeline.exact
                # ? timeline.date
                # : timeline.fill
                # ? tileDates.find(
                #     (_e, i, t) => i === t.length - 1 || t[i + 1] > timeline.date
                #   )
                # : tileDates.find(
                #     (e, i, t) =>
                #       e <= timeline.date &&
                #       (i === t.length - 1 || t[i + 1] > timeline.date)
                #   );
                child_date = None
                if mode == 'e':
                    child_date = date
                # the following assumes key_dates is sorted!
                if mode == 'f':
                    child_date = next((key_dates[i] for i in range(len(key_dates)) if i == len(key_dates) - 1 or key_dates[i+1] > date), None)
                if mode == 'b':
                    child_date = next((d for i, d in enumerate(key_dates) if d <= date and (i == len(key_dates) - 1 or key_dates[i+1] > date)), None)
                if child_date == None:
                    continue
                z, tx, tz = coords
                ptx = tx
                ptz = tz
                pos_x = 0
                pos_z = 0
                # check parent tiles up to min_zoom
                parents = []
                has_parent = False
                for pz in range(z - 1, min_zoom - 1, -1):
                    # calculate position of tile in the parent,
                    # measured in units of tile width
                    # (with (0,0) in the upper left, as usual)
                    pos_x += (ptx % 2) * (2 ** (z - 1 - pz))
                    pos_z += (ptz % 2) * (2 ** (z - 1 - pz))
                    ptx = ptx // 2
                    ptz = ptz // 2
                    parents.append(((pz, ptx, ptz), (pos_x, pos_z)))
                    # if this parent exists, don't create a replacement entry
                    curr_p_key = f"{pz}/{ptx}/{ptz}"
                    if mode == 'e' and curr_p_key in time_file_dict and date in time_file_dict[curr_p_key]:
                        # print('skipping',key,date,'due to',curr_p_key)
                        break
                    if mode == 'f' and curr_p_key in time_file_dict:
                        has_parent = True
                        # if the child tile is newer than the date,
                        # it should be skipped if it has a parent which is older than the date
                        if key not in skipped_tiles and date < child_date and date >= min(time_file_dict[curr_p_key]):
                            skipped_tiles[key] = curr_p_key
                            break
                        continue
                    if mode == 'b' and curr_p_key in time_file_dict and date >= min(time_file_dict[curr_p_key]):
                        break
                    # if all parents are missing,
                    # add the tile and position to each parent's entry

                    if pz == min_zoom and not has_parent:
                        for p_coords, (pos_x, pos_z) in parents:
                            p_key = f"{p_coords[0]}/{p_coords[1]}/{p_coords[2]}"
                            if p_key not in tile_replacements_dict:
                                tile_replacements_dict[p_key] = []
                            tile_replacements_dict[p_key].append({
                                'key': key,
                                'scale': 2 ** (p_coords[0] - z),
                                'pos_x': pos_x,
                                'pos_z': pos_z,
                                'date': child_date
                            })
            with open('deploy/data/' + dimension + '/' + date + '-' + mode + '.json', 'w') as outfile:
                json.dump({
                        'tileReplacements':tile_replacements_dict,
                        'skip': skipped_tiles
                    }, outfile, separators=(',', ':'), ensure_ascii=False)


    max_width = 2 ** (11 - min_zoom + 4 + (3 if dimension == 'nether' else 0))
    dim_dict = {
        'X0': X0,
        'Z0': Z0,
        'defaultX': default_X,
        'defaultZ': default_Z,
        'defaultZoom': default_zoom,
        'minZoom': min_zoom - 4,
        'maxZoom': max_zoom + 2,
        'minNativeZoom': min_zoom,
        'maxNativeZoom': max_zoom,
        'minX': min_X - 2 * max_width,
        'maxX': max_X + max_width,
        'minZ': min_Z - max_width,
        'maxZ': max_Z + max_width,
        'dates': sorted(dates),
        'fileDates': time_file_dict,
        'layers': sorted(layers, key=lambda layer: layer["id"]),
        'tilePath': tile_path,
        'errorTileUrl': error_tile_url,
        'tileSize': tile_size,
        'ratio': 2 ** (11 - (min_zoom - 4)) // tile_size,
    }

    with open('deploy/data/' + dimension + '.json', 'w') as outfile:
        json.dump(dim_dict, outfile, separators=(',', ':'), ensure_ascii=False)

with open('data/dates.json', 'r') as infile, open('deploy/data/dates.json', 'w') as outfile:
    over = json.load(infile)
    # write minified JSON
    json.dump(over, outfile, separators=(',', ':'), ensure_ascii=False)
