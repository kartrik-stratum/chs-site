/**
 * Vision Board catalog – the single source of truth for every step, option,
 * sub-option and style preset shown in the builder.
 *
 * Loaded by the browser (as window.VB_CATALOG via /js/catalog.js) and by the
 * Node backend (require) so that server-side validation always matches the UI.
 */
(function (root, factory) {
  const catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else root.VB_CATALOG = catalog;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IMG = '/images/options/';
  const PAT = '/images/patterns/';

  const opt = (id, name, desc, extra = {}) => ({ id, name, desc, image: IMG + id + '.jpg', ...extra });
  const pattern = (id, name, desc, extra = {}) => ({ id, name, desc, pattern: true, image: PAT + id + '-othello.svg', ...extra });
  const swatch = (id, name, desc, color) => ({ id, name, desc, color, image: IMG + id + '.png' });

  const steps = [
    {
      key: 'shower',
      title: 'Shower / Tub Style',
      short: 'Shower / Tub Style',
      icon: 'bath',
      skipLabel: 'shower / tub',
      options: [
        opt('walk-in-shower', 'Walk-In Shower', 'Barrier-free option, open entry', { badge: 'popular' }),
        opt('neo-angle-shower', 'Neo-Angle Shower', 'Corner-fitting diamond shape'),
        opt('tub-to-shower-conversion', 'Tub-to-Shower Conversion', 'Remove old tub, install modern shower', { badge: 'popular' }),
        opt('shower-to-tub-conversion', 'Shower-to-Tub Conversion', 'Replace shower with a relaxing tub'),
        opt('replacement-bathtub', 'Replacement Bathtub', 'Alcove soaker - fresh new tub'),
        opt('tub-shower-combo', 'Tub-Shower Combo', 'Versatile tub with overhead shower'),
        opt('walk-in-tub', 'Walk-In Tub', 'Therapeutic, side-entry door, optional jets')
      ]
    },
    {
      key: 'wallPattern',
      title: 'Wall Pattern',
      short: 'Wall Pattern',
      icon: 'grid',
      skipLabel: 'wall pattern',
      subOptions: [
        {
          key: 'etch',
          label: 'Panel Etch Design',
          default: 'othello',
          choices: [
            { id: 'othello', name: 'Othello', desc: 'Dark etch lines' },
            { id: 'grayline', name: 'Grayline', desc: 'Gray etch lines' }
          ]
        }
      ],
      options: [
        pattern('subway-3x6', '3×6″ Subway', 'Classic brick-bond Puro Stone panel', { badge: 'popular' }),
        pattern('subway-4x12', '4×12″ Subway', 'Elongated Puro Stone panel, modern proportions'),
        pattern('hexagonal-6', '6″ Hexagonal', 'Honeycomb geometric polymer panel'),
        pattern('marazzi-12x12', '12×12″ Marazzi', 'Classic square-grid non-porous panel'),
        pattern('fairfield-24x6', '24×6″ Fairfield', 'Long plank-look Puro Stone panel'),
        pattern('chevron', 'Chevron', 'V-shaped zigzag polymer panel pattern', { badge: 'designer' }),
        pattern('roman-block-12x24', '12×24″ Roman Block', 'Large-format offset Puro Stone panel'),
        pattern('milano-6x24', '6×24″ Milano', 'Narrow plank Puro Stone panel, vertical stack'),
        pattern('smooth-seamless', 'Smooth Seamless', 'One-piece polymer panel - no grout')
      ]
    },
    {
      key: 'wallColor',
      title: 'Wall Color',
      short: 'Wall Color',
      icon: 'palette',
      skipLabel: 'wall color',
      options: [
        swatch('white', 'White', 'Bright, clean classic', '#f8f8f5'),
        swatch('biscuit', 'Biscuit', 'Warm off-white cream', '#f5e7cf'),
        swatch('almond', 'Almond', 'Soft warm neutral', '#f6ebc9'),
        opt('calcutta-marble', 'Calcutta Marble', 'White with gray veining', { badge: 'popular' }),
        opt('pompeii-marble', 'Pompeii Marble', 'Warm marble with brown veining'),
        opt('bianco-travertine', 'Bianco Travertine', 'Natural stone look, warm tones'),
        opt('classic-concrete', 'Classic Concrete', 'Industrial matte gray'),
        opt('galena', 'Galena', 'Soft stone gray'),
        opt('tuscany', 'Tuscany', 'Warm golden travertine')
      ]
    },
    {
      key: 'flooring',
      title: 'Flooring',
      short: 'Flooring',
      icon: 'layers',
      skipLabel: 'flooring',
      options: [
        opt('porcelain-marble-look', 'Porcelain Marble-Look', 'Elegant veined tile, durable', { badge: 'popular' }),
        opt('porcelain-wood-look-plank', 'Porcelain Wood-Look Plank', 'Warm wood grain, waterproof'),
        opt('porcelain-concrete-stone-look', 'Porcelain Concrete/Stone-Look', 'Modern industrial matte finish'),
        opt('lvp-gray-driftwood', 'LVP Gray Driftwood', 'Cool gray weathered wood look'),
        opt('hexagon-mosaic', 'Hexagon Mosaic', 'Classic hex tile, timeless charm', { badge: 'designer' }),
        opt('slate-look-matte', 'Slate-Look Matte', 'Dark textured stone, non-slip')
      ]
    },
    {
      key: 'vanity',
      title: 'Vanity',
      short: 'Vanity',
      icon: 'cabinet',
      skipLabel: 'vanity',
      options: [
        opt('shaker-white', 'Shaker White', 'Clean, classic shaker-door cabinet', { badge: 'popular' }),
        opt('shaker-navy', 'Shaker Navy', 'Bold navy, brass hardware pop', { badge: 'designer' }),
        opt('flat-panel-white', 'Flat-Panel White', 'Modern slab front, minimalist'),
        opt('flat-panel-wood-tone', 'Flat-Panel Wood-Tone', 'Natural wood grain, warm modern'),
        opt('espresso-traditional', 'Espresso Traditional', 'Rich dark wood, raised panels'),
        opt('floating-wall-mounted', 'Floating Wall-Mounted', 'Wall-mounted, open floor below')
      ]
    },
    {
      key: 'countertop',
      title: 'Countertop',
      short: 'Countertop',
      icon: 'gem',
      skipLabel: 'countertop',
      options: [
        opt('quartz-white-marble-look', 'Quartz White / Marble-Look', 'Bright engineered stone, veined', { badge: 'popular' }),
        opt('quartz-gray', 'Quartz Gray', 'Cool gray engineered stone'),
        opt('quartz-black', 'Quartz Black', 'Dramatic contrast, sleek finish'),
        opt('granite-speckled-neutral', 'Granite Speckled Neutral', 'Natural stone, unique every slab'),
        opt('cultured-marble', 'Cultured Marble', 'Molded one-piece vanity top'),
        opt('butcher-block', 'Butcher Block', 'Warm hardwood, rustic charm')
      ]
    },
    {
      key: 'showerDoor',
      title: 'Shower Door',
      short: 'Shower Door',
      icon: 'door',
      skipLabel: 'shower door',
      subOptions: [
        {
          key: 'glass',
          label: 'Glass Type',
          default: 'clear',
          choices: [
            { id: 'clear', name: 'Clear', desc: 'Crystal-clear view' },
            { id: 'rain', name: 'Rain', desc: 'Textured vertical ripples' },
            { id: 'frost', name: 'Frost', desc: 'Frosted privacy finish' },
            { id: 'corrugated', name: 'Corrugated', desc: 'Ribbed/fluted texture' }
          ]
        },
        {
          key: 'vgroove',
          label: 'V-Groove Pattern (Optional)',
          default: 'none',
          choices: [
            { id: 'none', name: 'None' },
            { id: 'arrow', name: 'Arrow' },
            { id: 'hopscotch', name: 'Hopscotch' },
            { id: 'roman-block', name: 'Roman Block' },
            { id: 'vertical-block', name: 'Vertical Block' }
          ]
        }
      ],
      options: [
        opt('frameless', 'Frameless', 'Crystal-clear, minimal hardware'),
        opt('semi-frameless', 'Semi-Frameless', 'Glass with slim metal accents'),
        opt('sliding-bypass', 'Sliding / Bypass', 'Space-saving bypass panels'),
        opt('barn-door', 'Barn-Door', 'Sliding barn-door style track', { badge: 'designer' }),
        opt('pivot-hinged', 'Pivot / Hinged', 'Dramatic swing-open entry'),
        opt('framed', 'Framed', 'Classic full metal frame')
      ]
    },
    {
      key: 'faucet',
      title: 'Faucet & Hardware Finish',
      short: 'Faucet & Hardware Finish',
      icon: 'wrench',
      skipLabel: 'faucet & hardware',
      note: 'This finish applies to your door frame, faucet, accessories & mirror - keeping everything coordinated.',
      options: [
        opt('chrome', 'Chrome', 'Bright mirror finish, always classic', { badge: 'popular' }),
        opt('brushed-nickel', 'Brushed Nickel', 'Warm satin silver - hides water spots'),
        opt('matte-black', 'Matte Black', 'Bold, modern, fingerprint-resistant', { badge: 'designer' }),
        opt('oil-rubbed-bronze', 'Oil-Rubbed Bronze', 'Dark vintage patina warmth'),
        opt('brushed-bronzed-gold', 'Brushed / Bronzed Gold', 'Warm gold luxury accent')
      ]
    },
    {
      key: 'mirror',
      title: 'Mirror',
      short: 'Mirror',
      icon: 'mirror',
      skipLabel: 'mirror',
      options: [
        opt('framed-rectangle', 'Framed Rectangle', 'Classic framed mirror'),
        opt('frameless-rectangle', 'Frameless Rectangle', 'Clean edge-to-edge modern look'),
        opt('round-pill', 'Round / Pill', 'Organic shape, on-trend'),
        opt('arched', 'Arched', 'Arch-top silhouette, statement piece')
      ]
    },
    {
      key: 'accessories',
      title: 'Accessories',
      short: 'Accessories',
      icon: 'dots',
      multi: true,
      subtitle: 'Pick as many as you like, then tap Next.',
      note: 'Accessories use your Hardware Finish selection. Pick all you need!',
      options: [
        opt('corner-shelf', 'Corner Shelf', 'Acrylic corner shelf for storage'),
        opt('soap-dish', 'Soap Dish', 'Recessed or wall-mount holder'),
        opt('folding-shower-seat', 'Built-in / Folding Shower Seat', 'Fold-down bench for comfort'),
        opt('grab-bars', 'Grab Bars', 'Safety bars for support', { badge: 'popular' }),
        opt('shower-rod', 'Shower Rod', 'Curved or straight curtain rod'),
        opt('hand-held-wand', 'Hand-Held Wand', 'Flexible spray on slide bar'),
        opt('recessed-niche', 'Recessed Niche', 'Built-in shelf for shampoo', { badge: 'designer' }),
        opt('rainfall-head', 'Rainfall Head', 'Wide overhead rain showerhead')
      ]
    }
  ];

  /** One tap preloads the whole board. */
  const presets = [
    {
      id: 'spa-retreat',
      name: 'Spa Retreat',
      desc: 'Frameless glass, marble walls, hotel-spa calm',
      badge: 'most-popular',
      image: '/images/styles/spa-retreat.jpg',
      picks: {
        shower: 'walk-in-shower', wallPattern: 'roman-block-12x24', wallColor: 'calcutta-marble',
        flooring: 'porcelain-marble-look', vanity: 'floating-wall-mounted', countertop: 'quartz-white-marble-look',
        showerDoor: 'frameless', faucet: 'brushed-nickel', mirror: 'frameless-rectangle', accessories: ['recessed-niche']
      }
    },
    {
      id: 'timeless-classic',
      name: 'Timeless Classic',
      desc: 'Crisp Puro Stone subway panels + a deep soaking tub',
      image: '/images/styles/timeless-classic.jpg',
      picks: {
        shower: 'tub-shower-combo', wallPattern: 'subway-3x6', wallColor: 'white',
        flooring: 'hexagon-mosaic', vanity: 'shaker-white', countertop: 'quartz-white-marble-look',
        showerDoor: 'sliding-bypass', faucet: 'chrome', mirror: 'framed-rectangle', accessories: ['hand-held-wand', 'soap-dish']
      }
    },
    {
      id: 'modern-luxe',
      name: 'Modern Luxe',
      desc: 'Bold black hardware, clean lines, concrete tones',
      badge: 'designers-pick',
      image: '/images/styles/modern-luxe.jpg',
      picks: {
        shower: 'walk-in-shower', wallPattern: 'milano-6x24', wallColor: 'classic-concrete',
        flooring: 'porcelain-concrete-stone-look', vanity: 'flat-panel-wood-tone', countertop: 'quartz-black',
        showerDoor: 'barn-door', faucet: 'matte-black', mirror: 'round-pill', accessories: ['rainfall-head', 'recessed-niche']
      }
    },
    {
      id: 'accessible-comfort',
      name: 'Accessible Comfort',
      desc: 'Walk-in tub, grab bars, non-slip - safety with style',
      image: '/images/styles/accessible-comfort.jpg',
      accessible: true,
      picks: {
        shower: 'walk-in-tub', wallPattern: 'subway-4x12', wallColor: 'biscuit',
        flooring: 'slate-look-matte', vanity: 'shaker-white', countertop: 'cultured-marble',
        showerDoor: 'framed', faucet: 'brushed-nickel', mirror: 'framed-rectangle',
        accessories: ['grab-bars', 'folding-shower-seat', 'hand-held-wand']
      }
    }
  ];

  /** What the "Make it Accessible" toggle adds to the board. */
  const accessibleKit = {
    shower: 'walk-in-tub',
    flooring: 'slate-look-matte',
    accessories: ['grab-bars', 'folding-shower-seat', 'hand-held-wand']
  };

  const bestTimes = [
    { id: 'no-preference', name: 'No preference' },
    { id: 'morning', name: 'Morning (8am – 12pm)' },
    { id: 'afternoon', name: 'Afternoon (12pm – 5pm)' },
    { id: 'evening', name: 'Evening (5pm – 8pm)' }
  ];

  /** "I'm interested in" choices on the consultation forms. */
  const interests = [
    { id: 'walk-in-shower', name: 'Walk-in shower' },
    { id: 'walk-in-tub', name: 'Walk-in tub' },
    { id: 'stair-lift', name: 'Stair lift' },
    { id: 'home-elevator', name: 'Home elevator' },
    { id: 'other', name: 'Other' }
  ];

  const business = {
    name: 'Caliber Home Solutions',
    tagline: 'Aging-in-place remodeling & accessibility solutions',
    address: 'Boise, Idaho',
    phone: '(208) 552-3037',
    phoneHref: 'tel:+12085523037',
    hours: 'Mon-Fri 8-5',
    website: 'caliberhomesolutions.com',
    defaultCity: 'Boise',
    defaultState: 'ID'
  };

  const findStep = (key) => steps.find((s) => s.key === key);
  const findOption = (stepKey, id) => {
    const s = findStep(stepKey);
    return s ? s.options.find((o) => o.id === id) : undefined;
  };

  return { steps, presets, accessibleKit, bestTimes, interests, business, findStep, findOption, SKIP: '__skip__' };
});
