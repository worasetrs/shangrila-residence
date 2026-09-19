export const chapters = [
  { id: 'perspective', label: 'A quieter perspective', eyebrow: 'A place apart. A life in balance.', title: ['A quieter', 'perspective.'], description: 'Shangri-La Hua Hin. A considered balance of architecture, water and tropical landscape.', image: 'aerial', detail: 'THE COMPLETE PICTURE', camera: '01_AERIAL' },
  { id: 'overview', label: 'The master vision', eyebrow: '01 / The master vision', title: ['Space to', 'belong.'], description: 'Two residences. One shared landscape. A collection of spaces connected by an unhurried rhythm.', image: 'aerial', detail: 'ARCHITECTURE · LANDSCAPE · CONNECTION', camera: 'overview' },
  { id: 'arrival', label: 'The arrival', eyebrow: '02 / The arrival', title: ['Leave the', 'everyday behind.'], description: 'A landscaped approach leads from the entrance to a welcoming arrival court.', image: 'arrival', detail: 'ENTRANCE · GUARDHOUSE · DROP-OFF', camera: '02_ENTRANCE' },
  { id: 'water', label: 'Life by the water', eyebrow: '03 / Life by the water', title: ['Follow the', 'water’s edge.'], description: 'Soft curves, a planted island and places to pause. The pool forms the quiet heart of the project.', image: 'pool', detail: 'POOL · ISLAND · SUN DECK', camera: '03_POOL' },
  { id: 'pavilion', label: 'The pavilion', eyebrow: '04 / The pavilion', title: ['Come together.', 'Stay a little.'], description: 'An open, welcoming setting for dining and conversation, between the arrival court and the pool.', image: 'pavilion', detail: 'RESTAURANT · COVERED TERRACE', camera: '06_RESTAURANT' },
  { id: 'residences', label: 'The residences', eyebrow: '05 / The residences', title: ['A softer line', 'of architecture.'], description: 'Sculpted balconies, vertical screens and warm accents give Buildings A and B their tropical character.', image: 'building-a', detail: 'BUILDING A · BUILDING B', camera: 'P26_A_HERO' },
  { id: 'interiors', label: 'Within the residence', eyebrow: '06 / Within the residence', title: ['Warmth,', 'from within.'], description: 'Timber, soft neutrals and generous glazing. Interior spaces follow the original interior design references.', image: 'interior', detail: 'MATERIAL · LIGHT · OPENNESS', camera: 'SOURCE_INTERIOR_SOUTH' },
  { id: 'facilities', label: 'Considered throughout', eyebrow: '07 / Considered throughout', title: ['Every detail.', 'In its place.'], description: 'Pool facilities, staff accommodation and ground-floor parking complete the everyday workings of the project.', image: 'facilities', detail: 'P05 · P06 · GROUND-FLOOR PARKING', camera: '08_P06' },
];
export const navigation = [...chapters.map(c => ({id:c.id,label:c.label})), {id:'masterplan',label:'The master plan'}, {id:'closing',label:'Until we meet here'}];

// Normalized journey positions. Blender camera coordinates are exported to glTF Y-up.
// Bridge views rise above the site before crossing between distant buildings.
export function makeCameraPath(cameras) {
  const byName = Object.fromEntries(cameras.map(c=>[c.name,c]));
  const key = (t,name,distance=45) => {
    const c=byName[name];
    return {t,position:c.position,target:c.position.map((x,i)=>x+c.direction[i]*distance),fov:c.fov};
  };
  const aerial = key(0,'01_AERIAL',160);
  return [aerial,
    {t:1,position:[169,89,-7],target:[88,5,-66],fov:52},
    {t:1.65,position:[164,26,-13],target:[125,2,-50],fov:53},
    key(2,'02_ENTRANCE',48),
    {t:2.45,position:[123,36,-26],target:[91,2,-65],fov:55},
    key(3,'03_POOL',38),
    key(4,'06_RESTAURANT',28),
    key(5,'P26_A_HERO',58),
    {t:5.32,position:[174,62,-8],target:[85,9,-66],fov:53},
    key(5.58,'P26_B_HERO',48),
    {t:5.8,position:[146,42,-61],target:[121,8,-75],fov:58},
    key(6,'SOURCE_INTERIOR_SOUTH',7),
    key(6.23,'SOURCE_KITCHEN',7),
    {t:6.5,position:[136,28,-53],target:[117,5,-80],fov:58},
    key(6.75,'07_P05',24),
    key(7,'08_P06',36),
    key(7.35,'13_GF_PARKING',24),
    {...aerial,t:7.8},
  ];
}

export function samplePath(path,progress) {
  let i=0;
  while (i<path.length-2 && progress>path[i+1].t) i++;
  const a=path[i],b=path[i+1];
  const u=Math.max(0,Math.min(1,(progress-a.t)/(b.t-a.t)));
  const s=u*u*(3-2*u);
  return { position:a.position.map((v,k)=>v+(b.position[k]-v)*s), target:a.target.map((v,k)=>v+(b.target[k]-v)*s), fov:a.fov+(b.fov-a.fov)*s };
}
