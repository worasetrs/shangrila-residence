import images from './interior-assets.json';

export const chapters = [
 {id:'perspective',label:'A quieter perspective',eyebrow:'Hua Hin, Thailand',title:['Shangri-La','Residence.'],description:'Architecture, water and a slower rhythm of life.',image:'aerial'},
 {id:'overview',label:'The whole picture',eyebrow:'02 / The whole picture',title:['A place','in balance.'],description:'Two residences. A shared landscape. Room to breathe.',image:'aerial',detail:'BUILDINGS A & B · POOL · PAVILION · P05 · P06'},
 {id:'arrival',label:'The arrival',eyebrow:'03 / The arrival',title:['An unhurried','arrival.'],description:'From the entrance to the arrival court, a welcome shaped by landscape.',image:'arrival',detail:'IN / OUT · GUARDHOUSE · DROP-OFF'},
 {id:'water',label:'Life by the water',eyebrow:'04 / Life by the water',title:['At the heart','of it all.'],description:'A planted island. Soft curves. Places to pause beside the water.',image:'pool',detail:'POOL · ISLAND · SUN DECK'},
 {id:'explore',label:'Explore the project',eyebrow:'05 / Your own perspective',title:['Take a','closer look.'],description:'Turn the project around. Discover the places that make it whole.',image:'aerial',detail:'ROTATE · ZOOM · DISCOVER'},
];
export const navigation=[...chapters.map(({id,label})=>({id,label})),{id:'interiors',label:'Within the residence'},{id:'masterplan',label:'The master plan'},{id:'closing',label:'Until we meet here'}];
export const interiorScenes=[
 {id:'living',label:'Main Living',title:'Space to be together.',text:'Light, generous glazing and warm natural finishes.',images:[images.living]},
 {id:'dining',label:'Dining',title:'Gather, naturally.',text:'Dining sits within the shared double-height living volume.',images:[images.dining]},
 {id:'kitchen',label:'Kitchen',title:'Everyday rituals.',text:'Timber, stone and a considered place for daily life.',images:[images.kitchen]},
 {id:'bedroom',label:'Master Bedroom',title:'A quieter retreat.',text:'Soft textures and a calm, warm palette.',images:[images.bedroom]},
 {id:'bathroom',label:'Master Bathroom',title:'A moment of calm.',text:'Pale stone, gentle light and quiet details.',images:[images.bathroom]},
 {id:'restaurant',label:'Restaurant Interior',title:'Stay a little longer.',text:'An inviting setting for dining and conversation.',images:[images.restaurant]},
 {id:'spa',label:'P05 Spa / Sauna',title:'Time to slow down.',text:'A restful material palette for the poolside wellness spaces.',images:[images.spa,images.sauna],views:['Spa','Sauna']},
 {id:'staff',label:'P06 Staff Accommodation',title:'Considered throughout.',text:'Practical shared accommodation, with warmth and simplicity.',images:[images.staff]},
];
