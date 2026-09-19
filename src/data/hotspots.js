// Positions are source-camera targets; surface anchors are refined from GLB bounds.
export const exploreView={position:[177,119,71],target:[86,5,-65],fov:45};
export const exploreLimits={minDistance:28,maxDistance:260,minPolarAngle:.18,maxPolarAngle:1.36,minHeight:4,targetMin:[26,1,-97],targetMax:[144,22,-36]};
export const hotspots=[
 {id:'building-a',label:'Building A',group:'BUILDING_A_',anchor:[122,23,-74],camera:'P26_A_HERO',distance:58,image:'building-a',description:'Sculpted balconies and tropical screens frame the main residence.'},
 {id:'building-b',label:'Building B',group:'BUILDING_B_',anchor:[39,23,-62],camera:'P26_B_HERO',distance:48,image:'building-b',description:'A companion residence, connected by the shared landscape.'},
 {id:'restaurant',label:'Restaurant',group:'RESTAURANT_',anchor:[99,6,-50],camera:'06_RESTAURANT',distance:28,image:'pavilion',description:'Dining and a covered terrace between the arrival court and pool.'},
 {id:'pool',label:'Pool',group:'POOL_',anchor:[81,1,-72],camera:'03_POOL',distance:38,image:'pool',description:'A free-form pool, planted island and generous sun deck.'},
 {id:'p05',label:'P05 · Pool facilities',group:'P05_POOL_FACILITIES_',anchor:[110,7,-84],camera:'07_P05',distance:24,image:'/images/hotspots/p05.webp',description:'Changing, spa and sauna spaces beside the water.'},
 {id:'p06',label:'P06 · Staff accommodation',group:'P06_STAFF_ACCOMMODATION_',anchor:[139,11,-84],camera:'08_P06',distance:36,image:'facilities',description:'The staff residence supporting the everyday life of the project.'},
 {id:'guardhouse',label:'Guardhouse',group:'GUARDHOUSE_',anchor:[127,5,-39],camera:'09_GUARDHOUSE',distance:23,image:'arrival',description:'The entrance landmark beside the project’s IN / OUT approach.'},
];
