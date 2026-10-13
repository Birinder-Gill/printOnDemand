#!/bin/sh
cd /home/claude/work/r3d
R="node render3d.cjs"
[ -f final/r_hero.png ] || $R "shot=hero&ry=30&cy=15&ly=5.4&cz=40&env=0.6" final/r_hero.png 2400
[ -f final/r_hero_nogr.png ] || $R "shot=hero&ry=30&cy=15&ly=5.4&cz=40&env=0.6&noground=1" final/r_hero_nogr.png 2400
[ -f final/r_hero_fore.png ] || $R "shot=hero&ry=-26&cy=15&ly=5.4&cz=40&env=0.6" final/r_hero_fore.png 2400
[ -f final/r_flat.png ] || $R "shot=flat&rz=-14&env=0.6&cy=38&cz=21" final/r_flat.png 2400
[ -f final/r_duo.png ] || $R "shot=duo&cz=47&cy=8&ly=5.5&env=0.6" final/r_duo.png 2400 1.25
[ -f final/r_spine.png ] || $R "shot=spine&cy=14&env=0.6" final/r_spine.png 2400
for pr in "12 13" "42 43" "62 63" "66 67" "02 03" "06 07" "26 27" "64 65" "58 59" "40 41"; do
  set -- $pr
  [ -f final/r_open_$1_$2.png ] || $R "shot=open&l=/pages/p-$1.png&r=/pages/p-$2.png&cy=30&cz=31&ry=-10&fov=22&env=0.6" final/r_open_$1_$2.png 2400 1.25
done
echo DONE
