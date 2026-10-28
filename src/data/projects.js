// N-Tech's own projects. Names and status are real; the place, type and blurb
// lines are best guesses to confirm with the client (marked TO CONFIRM), and
// no areas, years or loads are stated until they are.
// Photos are licensed stand-ins from Wikimedia Commons (see src/assets/credits.json),
// NOT these buildings. Swap in real project photography before launch.
export const projects = [
  {
    id: 'hotel-manipal-inn',
    name: 'Hotel Manipal Inn',
    status: 'Completed',
    sector: 'Hospitality',
    city: 'Manipal',
    photo: 'p66.jpg',
    alt: 'Hotel lobby with warm lighting',
    blurb: 'Guest rooms, kitchens and public floors served by one coordinated set of plumbing, power and fire drawings.',
  },
  {
    id: 'grassland-woodsville',
    name: 'Grassland Woodsville',
    status: 'Completed',
    sector: 'Residential', // TO CONFIRM
    city: null, // TO CONFIRM
    photo: 'p167.jpg',
    alt: 'Apartment courtyard with planted beds',
    blurb: 'Homes set among green space, with water, drainage, power and fire safety designed around the landscape.',
  },
  {
    id: 'hotel-ocean-pearl',
    name: 'Hotel Ocean Pearl',
    status: 'Completed',
    sector: 'Hospitality',
    city: 'Udupi',
    photo: 'p198.jpg',
    alt: 'Glass hotel entrance lit at night',
    blurb: 'A city hotel whose hot water, standby power and sprinkler systems run quietly behind the guest experience.',
  },
  {
    id: 'landtrade-mahalakshmi',
    name: 'Landtrade Mahalakshmi',
    status: 'Ongoing',
    sector: 'Residential', // TO CONFIRM
    city: 'Mangaluru', // TO CONFIRM
    photo: 'p172.jpg',
    alt: 'White apartment block with square windows',
    blurb: 'Residential development for Land Trades, now on the drawing board.',
  },
  {
    id: 'landtrade-pristine',
    name: 'Landtrade Pristine',
    status: 'Ongoing',
    sector: 'Residential', // TO CONFIRM
    city: 'Mangaluru', // TO CONFIRM
    photo: 'p170.jpg',
    alt: 'Apartment towers beside water',
    blurb: 'Residential development for Land Trades, now on the drawing board.',
  },
  {
    id: 'landtrade-altitude',
    name: 'Landtrade Altitude',
    status: 'Ongoing',
    sector: 'Residential', // TO CONFIRM
    city: 'Mangaluru', // TO CONFIRM
    photo: 'p202.jpg',
    alt: 'Glass facades rising into the sky',
    blurb: 'Residential development for Land Trades, now on the drawing board.',
  },
];

export const completed = projects.filter((p) => p.status === 'Completed');
export const ongoing = projects.filter((p) => p.status === 'Ongoing');
export const statuses = ['Completed', 'Ongoing'];
// "Hospitality — Manipal", or just the sector when the place isn't known yet
export const placeOf = (p) => [p.sector, p.city].filter(Boolean).join(' — ');
