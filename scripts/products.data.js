// scripts/products.data.js
const CATEGORIES = [
  { slug: "dog", name: "Dog" },
  { slug: "cat", name: "Cat" },
  { slug: "holiday", name: "Holiday" },
  { slug: "plush", name: "Plush" },
  { slug: "chew toys", name: "Chew Toys" },
  { slug: "interactive", name: "Interactive" },
  { slug: "bundle", name: "Bundle / Set" },
];

// optional: quick-pick presets for UI
const CATEGORY_PRESETS = {
  dogOnly: ["dog"],
  catOnly: ["cat"],
  dogPlush: ["dog", "plush"],
};

// scripts/products.data.js (continued)
const PRODUCTS = [
  // ---------- DOG ----------
  {
    slug: "bark-frosty-the-smoreman",
    title: "Bark Frosty the S'moreman Dog Toy",
    subtitle: "Small/Medium plush squeaker",
    description:
      "Toasty winter vibes! Soft plush with an internal squeaker—perfect for gentle play and quick zoomies.",
    priceCents: 799,
    categories: ["dog", "holiday", "plush"],
    images: [], // add filenames later, e.g. ["smoreman-1.jpg"]
  },
  {
    slug: "bark-get-lit-wreath",
    title: "Bark Get Lit Wreath Dog Toy",
    subtitle: "Festive plush",
    description:
      "Bring the holiday cheer! A soft wreath toy with crinkles/squeaks to keep the party going.",
    priceCents: 799,
    categories: ["dog", "holiday", "plush"],
    images: [],
  },
  {
    slug: "bark-grandy-cane-plush",
    title: "Bark Grandy Cane Plush Dog Toy",
    subtitle: "Oversized candy-cane fun",
    description:
      "A big, cuddly candy cane plush for tug, toss, and seasonal photos. Squeaks included.",
    priceCents: 1199,
    categories: ["dog", "holiday", "plush"],
    images: [],
  },
  {
    slug: "bark-toaster-poodle",
    title: "Bark Toaster Poodle Plush Dog Toy",
    subtitle: "Punny & plush",
    description:
      "Light, squeaky, and adorable—this poodle pops with personality. Great for small to medium pups.",
    priceCents: 799,
    categories: ["dog", "plush"],
    images: [],
  },
  {
    slug: "fuzzyard-jolly-milk-cookies-3pk",
    title: "Fuzzyard Jolly Milk & Cookies Plush 3-Pack",
    subtitle: "Bundle of three plush toys",
    description:
      "Milk + two cookies—three squeaky plushies for variety and festive fetch.",
    priceCents: 1299,
    categories: ["dog", "holiday", "plush", "bundle"],
    images: [],
  },
  {
    slug: "kong-holiday-comfort-hedgehug-md",
    title: "KONG Holiday Comfort HedgeHug (Md)",
    subtitle: "Soft cuddle plush",
    description:
      "Classic KONG comfort with a seasonal twist. Gentle, cozy, and perfect for downtime snuggles.",
    priceCents: 999,
    categories: ["dog", "holiday", "plush"],
    images: [],
  },
  {
    slug: "multipet-lamb-chop-10",
    title: 'Multipet Lamb Chop 10" Plush',
    subtitle: "Beloved classic",
    description:
      "The iconic Lamb Chop with a squeaker. Soft, nostalgic, and photo-ready.",
    priceCents: 1299,
    categories: ["dog", "plush"],
    images: [],
  },
  {
    slug: "multipet-loofa-dog-12",
    title: 'Multipet Loofa Dog Plush 12" (Assorted)',
    subtitle: "Long, squeaky plush",
    description:
      "The fan-favorite loofa shape—easy to grab and perfect for a shake. Colors vary.",
    priceCents: 525,
    categories: ["dog", "plush"],
    images: [],
  },
  {
    slug: "vip-jr-ultimate-ring-camo-blue-sm",
    title: "VIP JR Ultimate Ring (Camo Blue, Sm)",
    subtitle: "Durable ring for fetch & tug",
    description:
      "Tougher play in a smaller ring. Great for fetch, tug, and chewers-in-training.",
    priceCents: 1299,
    categories: ["dog", "chew", "interactive"],
    images: [],
  },
  {
    slug: "multipet-loofa-christmas-squeaker-mat-12",
    title: 'Multipet Loofa Christmas Squeaker Mat 12"',
    subtitle: "Holiday squeaker mat",
    description:
      "A festive mat with multiple squeakers—satisfying crunch with every pounce.",
    priceCents: 1099,
    categories: ["dog", "holiday", "plush", "interactive"],
    images: [],
  },
  {
    slug: "zippypaws-burrow-christmas-tree",
    title: "ZippyPaws Burrow – Christmas Tree",
    subtitle: "Hide-and-seek burrow toy",
    description:
      "Interactive puzzle play: stuff the minis in the tree and let your pup ‘dig’ them out.",
    priceCents: 1499,
    categories: ["dog", "holiday", "interactive"],
    images: [],
  },
  {
    slug: "zippypaws-holiday-donutz-peppermint",
    title: "ZippyPaws Holiday Donutz – Peppermint",
    subtitle: "Plush donut squeaker",
    description:
      "No stuffing, all squeak. Sweet seasonal donut that’s perfect for light chewers.",
    priceCents: 799,
    categories: ["dog", "holiday", "plush"],
    images: [],
  },

  // ---------- CAT ----------
  {
    slug: "zippyclaws-catnip-crusherz-merlot",
    title: "ZippyClaws Catnip Crusherz – Merlot",
    subtitle: "Catnip plush bottle",
    description:
      "A fanciful merlot bottle stuffed with catnip for classy zooms and bunny kicks.",
    priceCents: 400,
    categories: ["cat", "plush", "interactive"],
    images: [],
  },
  {
    slug: "zippyclaws-burrow-birds-in-nest",
    title: "ZippyClaws Burrow – Birds in Nest",
    subtitle: "Hide-and-seek for cats",
    description:
      "Mini birds in a soft nest—paw, pull, repeat. Engaging enrichment for curious kitties.",
    priceCents: 999,
    categories: ["cat", "interactive", "plush"],
    images: [],
  },
  {
    slug: "multipet-ice-cream-cone-3in",
    title: 'Multipet Ice Cream Cone 3" (Assorted)',
    subtitle: "Small plush cones",
    description:
      "Cute cones with a dash of catnip. Assorted colors; perfect size for swats and carries.",
    priceCents: 300,
    categories: ["cat", "plush"],
    images: [],
  },
  {
    slug: "multipet-pizza-3-25in",
    title: 'Multipet Pizza 3.25" (Assorted)',
    subtitle: "Cheesy catnip slice",
    description:
      "A slice of fun—lightweight, crinkly, and catnip-kissed. Assorted styles.",
    priceCents: 250,
    categories: ["cat", "plush"],
    images: [],
  },
  {
    slug: "multipet-cardboard-roller-17in",
    title: 'Multipet Cardboard Roller 17"',
    subtitle: "Classic chaser toy",
    description:
      "Simple, satisfying rolling fun. Bat it, chase it, nap on it—cat rules apply.",
    priceCents: 400,
    categories: ["cat", "interactive"],
    images: [],
  },
  {
    slug: "multipet-candy-crackle-feathers-8in",
    title: 'Multipet Candy Crackle w/ Feathers 8"',
    subtitle: "Crinkle + feathers",
    description:
      "Crinkly ‘candy’ with fluttery feathers—irresistible for swats and pounces.",
    priceCents: 250,
    categories: ["cat", "interactive", "plush"],
    images: [],
  },
  {
    slug: "kong-teaser-butterfly",
    title: "KONG Teaser Butterfly",
    subtitle: "Teaser wand",
    description:
      "A fluttery butterfly on a wand for active play and healthy leaps.",
    priceCents: 450,
    categories: ["cat", "interactive"],
    images: [],
  },
  {
    slug: "kong-connects-punching-bag",
    title: "KONG Connects Punching Bag",
    subtitle: "Hang-up swat toy",
    description:
      "Mountable swat toy to keep paws busy. Great for solo batting sessions.",
    priceCents: 1299,
    categories: ["cat", "interactive"],
    images: [],
  },
  {
    slug: "petcandy-holiday-stix",
    title: "Petcandy Holiday Stix",
    subtitle: "Festive kicker sticks",
    description:
      "Soft kickers with seasonal flair. Perfect for bunny kicks and cuddle naps.",
    priceCents: 699,
    categories: ["cat", "holiday", "plush"],
    images: [],
  },
  {
    slug: "petcandy-holiday-kittles",
    title: "Petcandy Holiday Kittles",
    subtitle: "Small holiday toys",
    description:
      "Tiny seasonal toys for swats, carries, and pitter-patter sprints.",
    priceCents: 350,
    categories: ["cat", "holiday", "plush"],
    images: [],
  },
  {
    slug: "pearhead-naughty-or-nice-set",
    title: "Pearhead Naughty or Nice Cat Toy Set",
    subtitle: "Two-pack holiday set",
    description:
      "A playful duo for the ‘sometimes nice’ kitty. Photo-worthy and fun.",
    priceCents: 600,
    categories: ["cat", "holiday", "bundle"],
    images: [],
  },
  {
    slug: "zippyclaws-mini-donutz-3pk",
    title: "ZippyClaws Mini Donutz 3-Pack",
    subtitle: "Three tiny donut toys",
    description:
      "A trio of plush mini donuts—paw-sized and perfect for batting practice.",
    priceCents: 799,
    categories: ["cat", "plush", "bundle"],
    images: [],
  },
];

module.exports = { CATEGORIES, CATEGORY_PRESETS, PRODUCTS };