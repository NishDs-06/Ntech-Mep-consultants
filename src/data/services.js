// Scope written against the Indian codes an MEP consultant designs to:
// NBC 2016 (Part 4 fire & life safety, Part 8 building services, Part 9 plumbing),
// the relevant IS codes, and the statutory approvals each discipline needs.
export const services = [
  {
    id: 'phe',
    code: 'PHE',
    title: 'Public Health Engineering',
    short: 'Public Health',
    statement: 'Water in, waste out — sized, routed and treated so nothing is wasted.',
    scope: [
      'Domestic, flushing & hot water supply',
      'Soil, waste, vent & storm drainage',
      'Rainwater harvesting & recharge',
      'STP, WTP & RO process coordination',
    ],
    codes: 'NBC 2016 Part 9 · IS 2065 · IS 1742 · CPHEEO',
    photo: 'p83.jpg',
    photoAlt: 'Valves and coloured pipework in an industrial plant room',
  },
  {
    id: 'ele',
    code: 'ELE',
    title: 'Electrical Engineering',
    short: 'Electrical',
    statement: 'Power that is sized right, safe by design and quietly redundant.',
    scope: [
      'HT / LT distribution & substations',
      'DG, UPS & standby power',
      'Lighting design & controls',
      'Earthing, lightning protection & ELV',
    ],
    codes: 'NBC 2016 Part 8 · IS 732 · IS 3043 · IS/IEC 62305',
    photo: 'p242.jpg',
    photoAlt: 'Switchgear room lined with busbars and cabling',
  },
  {
    id: 'fire',
    code: 'FPS',
    title: 'Fire Protection',
    short: 'Fire Fighting',
    statement: 'Designed for the one day everything else in the building fails.',
    scope: [
      'Hydrant, hose reel & yard hydrants',
      'Automatic sprinkler systems',
      'Fire detection & alarm',
      'Pump rooms, storage & gas suppression',
    ],
    codes: 'NBC 2016 Part 4 · IS 15105 · IS 2189 · IS 13039',
    photo: 'p94.jpg',
    photoAlt: 'Red fire hydrant standing on a gravel bed',
  },
];
