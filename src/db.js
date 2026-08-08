import { secureStorage } from './utils/security';
import { getSupabaseClient, syncArrayToSupabase, deleteRowInSupabase } from './utils/supabase';

const localStorage = {
  getItem(key) {
    const val = secureStorage.getItem(key);
    return val ? JSON.stringify(val) : null;
  },
  setItem(key, value) {
    try {
      const parsed = JSON.parse(value);
      secureStorage.setItem(key, parsed);
    } catch(e) {
      secureStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    secureStorage.removeItem(key);
  }
};

// Pre-seeded database values for ReviewSmart Clone with extensive category catalog
const initialCategories = [
  { 
    id: "home-garden", 
    name: "Home & Garden", 
    subcategories: [
      "Vacuums, Cleaning, & Laundry",
      "Bathroom",
      "Garden & Outdoors",
      "Heating, Cooling, & Air Quality",
      "Home & Decor",
      "Home Improvement",
      "Home Security & Safety",
      "Office",
      "Sleep"
    ] 
  },
  { 
    id: "kitchen", 
    name: "Kitchen", 
    subcategories: [
      "Large Appliances",
      "Small Appliances",
      "Cookware",
      "Coffee & Tea",
      "Food & Drink",
      "Dining & Entertaining",
      "Storage & Cleaning"
    ] 
  },
  { 
    id: "health-fitness", 
    name: "Health & Lifestyle", 
    subcategories: [
      "Fitness",
      "Health & Medical",
      "Personal Care",
      "Grooming & Makeup"
    ] 
  },
  { 
    id: "electronics", 
    name: "Tech", 
    subcategories: [
      "Electronics & Networking",
      "Phones & Tablets",
      "Computers & Laptops",
      "Audio",
      "TVs & Home Theater",
      "Cameras",
      "Smart Home"
    ] 
  },
  { 
    id: "baby-kid", 
    name: "Baby & Kid", 
    subcategories: [
      "Pregnancy & Nursing",
      "Baby Gear & Care",
      "School & Apparel",
      "Toys, Hobbies & Travel"
    ] 
  },
  { 
    id: "style", 
    name: "Style", 
    subcategories: [
      "Apparel & Basics",
      "Underwear & Sleepwear",
      "Shoes & Socks",
      "Bags & Accessories"
    ] 
  },
  { 
    id: "gifts", 
    name: "Gifts", 
    subcategories: [
      "Gifts for Grown-Ups",
      "Gifts for Kids",
      "Seasonal Gifts"
    ] 
  },
  {
    id: "web-hosting-software",
    name: "Web Hosting & Software",
    subcategories: [
      "Web Hosting",
      "Software & SaaS"
    ]
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    subcategories: [
      "Outdoor Recreation",
      "Athletic & Fitness"
    ]
  }
];

const initialProducts = [
  {
    id: "anvil",
    articleId: "best-basic-home-toolkit",
    badge: "Our pick",
    badgeColor: "bg-reviewsmart-brand",
    name: "Anvil Homeowner’s Tool Set",
    tagline: "The best basic tool kit",
    shortDescription: "This kit has all of the essentials in a small package, making it the best choice for common home repairs and upgrades.",
    price: "$45",
    merchant: "The Home Depot",
    rating: 4.8,
    reviewsCount: 1420,
    image: "/anvil_tool_set.png",
    pieces: 76,
    caseType: "Hard Plastic Case",
    buyUrl: "https://www.homedepot.com",
    pros: [
      "Compact, laptop-sized case ideal for closet storage",
      "Exceptional adjustable wrench with comfortable padded grip",
      "No useless filler to inflate count",
      "Includes 22 hex keys"
    ],
    cons: [
      "Extremely flimsy and inaccurate plastic torpedo level",
      "Low-quality clamps and scissors that break easily"
    ],
    toolsIncluded: {
      hammer: "Yes (8 oz Fiberglass handle)",
      tapeMeasure: "Yes (12-foot, rubberized)",
      screwdriver: "Yes (Driver + 30 bits)",
      hexKeys: "Yes (22 keys)",
      pliers: "Yes (Slip-joint)",
      adjustableWrench: "Yes (8-inch padded)",
      level: "Yes (Flimsy level)",
      utilityKnife: "Yes (Knife + 5 blades)"
    }
  },
  {
    id: "workpro",
    articleId: "best-basic-home-toolkit",
    badge: "Runner-up",
    badgeColor: "bg-gray-800",
    name: "WorkPro 100-Piece Kitchen Drawer Tool Kit",
    tagline: "A more limited selection of good-quality tools",
    shortDescription: "The quality of these tools is the same as for tools in our main pick, but the selection of tools isn’t as good.",
    price: "$34",
    merchant: "Amazon",
    rating: 4.6,
    reviewsCount: 890,
    image: "/workpro_tool_kit.png",
    pieces: 100,
    caseType: "Zippered Soft Pouch",
    buyUrl: "https://www.amazon.com",
    pros: [
      "Flexible zippered soft case",
      "Elastic loops and Velcro straps hold tools securely",
      "Same grade tool steel as our top pick"
    ],
    cons: [
      "Metric-only hex keys (no SAE keys)",
      "No wide-jaw or slip-joint pliers",
      "Shorter 10-foot tape measure"
    ],
    toolsIncluded: {
      hammer: "Yes (8 oz claw)",
      tapeMeasure: "Yes (10-foot)",
      screwdriver: "Yes (Driver + 40 bits)",
      hexKeys: "Yes (Metric-only)",
      pliers: "Yes (Needle-nose only)",
      adjustableWrench: "Yes (8-inch standard)",
      level: "Yes (9-inch level)",
      utilityKnife: "Yes (Standard knife)"
    }
  }
];

const categoryImages = {
  "home-garden": [
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=500"
  ],
  "kitchen": [
    "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=500"
  ],
  "health-fitness": [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1559591937-e9b288b645d8?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=500"
  ],
  "electronics": [
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=500"
  ],
  "baby-kid": [
    "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1591533564757-bc09be3e3bdf?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=500"
  ],
  "style": [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=500"
  ],
  "gifts": [
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&q=80&w=500"
  ]
};

const genericImages = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400"
];

const subcategoryTemplates = {
  "Vacuums, Cleaning, & Laundry": [
    { title: "The Best Cordless Vacuum Cleaners", keyword: "cordless vacuum", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Robot Vacuums", keyword: "robot vacuum", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Spin Mops and Spray Mops", keyword: "spin mop", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Bathroom": [
    { title: "The Best Shower Heads", keyword: "shower head", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Plush Bath Mats", keyword: "bath mat", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Waffle-Weave Towels", keyword: "towel", mainImgIdx: 3, blockImgIdx: 4 }
  ],
  "Garden & Outdoors": [
    { title: "The Best Family Camping Tents", keyword: "camping tent", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Portable Charcoal Grills", keyword: "portable grill", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best Heavy-Duty Garden Hoses", keyword: "garden hose", mainImgIdx: 4, blockImgIdx: 5 }
  ],
  "Heating, Cooling, & Air Quality": [
    { title: "The Best HEPA Air Purifiers", keyword: "air purifier", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best Portable Air Conditioners", keyword: "portable AC", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Energy-Efficient Space Heaters", keyword: "space heater", mainImgIdx: 5, blockImgIdx: 6 }
  ],
  "Home & Decor": [
    { title: "The Best Area Rugs for Living Rooms", keyword: "area rug", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Table Lamps for Reading", keyword: "table lamp", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best Wooden Picture Frames", keyword: "picture frame", mainImgIdx: 6, blockImgIdx: 7 }
  ],
  "Home Improvement": [
    { title: "The Best Basic Home Tool Kits", keyword: "home tool kit", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best 20V Cordless Drills", keyword: "cordless drill", mainImgIdx: 6, blockImgIdx: 7 },
    { title: "The Best Magnetic Screwdriver Sets", keyword: "screwdriver set", mainImgIdx: 7, blockImgIdx: 8 }
  ],
  "Home Security & Safety": [
    { title: "The Best Keyless Smart Door Locks", keyword: "smart door lock", mainImgIdx: 6, blockImgIdx: 7 },
    { title: "The Best Smart Smoke Detectors", keyword: "smoke detector", mainImgIdx: 7, blockImgIdx: 8 },
    { title: "The Best Outdoor Security Cameras", keyword: "security camera", mainImgIdx: 8, blockImgIdx: 0 }
  ],
  "Office": [
    { title: "The Best Motorized Standing Desks", keyword: "standing desk", mainImgIdx: 7, blockImgIdx: 8 },
    { title: "The Best Ergonomic Mesh Office Chairs", keyword: "office chair", mainImgIdx: 8, blockImgIdx: 0 },
    { title: "The Best Smart LED Desk Lamps", keyword: "desk lamp", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Sleep": [
    { title: "The Best Hybrid Memory Foam Mattresses", keyword: "memory foam mattress", mainImgIdx: 8, blockImgIdx: 0 },
    { title: "The Best Contour Bed Pillows", keyword: "bed pillow", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Blackout Sleep Masks", keyword: "sleep mask", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Large Appliances": [
    { title: "The Best French Door Refrigerators", keyword: "refrigerator", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Quiet Built-In Dishwashers", keyword: "dishwasher", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Smart Front-Load Washing Machines", keyword: "washing machine", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Small Appliances": [
    { title: "The Best Digital Air Fryers", keyword: "air fryer", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best High-Speed Smoothie Blenders", keyword: "blender", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best 6-Slice Toaster Ovens", keyword: "toaster oven", mainImgIdx: 3, blockImgIdx: 4 }
  ],
  "Cookware": [
    { title: "The Best 10-Inch Nonstick Skillets", keyword: "skillet", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Pre-Seasoned Cast Iron Skillets", keyword: "cast iron skillet", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best 8-Inch Japanese Chef Knives", keyword: "chef knife", mainImgIdx: 4, blockImgIdx: 5 }
  ],
  "Coffee & Tea": [
    { title: "The Best 12-Cup Drip Coffee Makers", keyword: "coffee maker", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best Gooseneck Electric Tea Kettles", keyword: "electric kettle", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Semi-Automatic Espresso Machines", keyword: "espresso machine", mainImgIdx: 5, blockImgIdx: 6 }
  ],
  "Food & Drink": [
    { title: "The Best Cold-Pressed Extra Virgin Olive Oils", keyword: "olive oil", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Gourmet Hot Sauces", keyword: "hot sauce", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best Fruit-Flavored Sparkling Waters", keyword: "sparkling water", mainImgIdx: 6, blockImgIdx: 0 }
  ],
  "Dining & Entertaining": [
    { title: "The Best Matte Ceramic Dinnerware Sets", keyword: "dinnerware", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best Crystal Wine Glasses", keyword: "wine glass", mainImgIdx: 6, blockImgIdx: 0 },
    { title: "The Best 20-Piece Stainless Flatware Sets", keyword: "flatware", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Storage & Cleaning": [
    { title: "The Best Airtight Glass Food Containers", keyword: "food container", mainImgIdx: 6, blockImgIdx: 0 },
    { title: "The Best Motion-Sensor Kitchen Trash Cans", keyword: "trash can", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Space-Saving Dish Drying Racks", keyword: "dish rack", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Fitness": [
    { title: "The Best Space-Saving Adjustable Dumbbells", keyword: "dumbbells", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best 1/4-Inch Non-Slip Yoga Mats", keyword: "yoga mat", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best High-Density Foam Rollers", keyword: "foam roller", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Health & Medical": [
    { title: "The Best Fast-Reading Digital Thermometers", keyword: "thermometer", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Smart Blood Pressure Monitors", keyword: "BP monitor", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Fingertip Pulse Oximeters", keyword: "pulse oximeter", mainImgIdx: 3, blockImgIdx: 0 }
  ],
  "Personal Care": [
    { title: "The Best Electric Toothbrushes", keyword: "electric toothbrush", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Cordless Water Flossers", keyword: "water flosser", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Ionic Infrared Hair Dryers", keyword: "hair dryer", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Grooming & Makeup": [
    { title: "The Best Non-Greasy Facial Sunscreens", keyword: "sunscreen", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Daily Moisturizers for Dry Skin", keyword: "moisturizer", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Hydrating Tinted Lip Balms", keyword: "lip balm", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Electronics & Networking": [
    { title: "The Best Wi-Fi 6 Mesh Routers", keyword: "wifi router", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Surge-Protected Power Strips", keyword: "power strip", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best 2TB External Hard Drives", keyword: "hard drive", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Phones & Tablets": [
    { title: "The Best 65W GaN USB-C Chargers", keyword: "usb charger", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best 20000mAh Portable Chargers", keyword: "power bank", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Durable Protective Phone Cases", keyword: "phone case", mainImgIdx: 3, blockImgIdx: 4 }
  ],
  "Computers & Laptops": [
    { title: "The Best Laptops for Work and Study", keyword: "laptop", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best 27-Inch 4K IPS Computer Monitors", keyword: "monitor", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best Ergonomic Split Keyboards", keyword: "keyboard", mainImgIdx: 4, blockImgIdx: 5 }
  ],
  "Audio": [
    { title: "The Best Active Noise-Canceling Headphones", keyword: "headphones", mainImgIdx: 3, blockImgIdx: 4 },
    { title: "The Best True Wireless Sport Earbuds", keyword: "earbuds", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Rugged Waterproof Bluetooth Speakers", keyword: "bluetooth speaker", mainImgIdx: 5, blockImgIdx: 6 }
  ],
  "TVs & Home Theater": [
    { title: "The Best 65-Inch 4K QLED Smart TVs", keyword: "4k tv", mainImgIdx: 4, blockImgIdx: 5 },
    { title: "The Best Dolby Atmos Dolby Soundbars", keyword: "soundbar", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best 4K HDR Streaming Devices", keyword: "streaming stick", mainImgIdx: 6, blockImgIdx: 0 }
  ],
  "Cameras": [
    { title: "The Best Mirrorless Cameras for Travel", keyword: "mirrorless camera", mainImgIdx: 5, blockImgIdx: 6 },
    { title: "The Best Portable Instant Film Cameras", keyword: "instant camera", mainImgIdx: 6, blockImgIdx: 0 },
    { title: "The Best 1080p Webcams for Zoom Calls", keyword: "webcam", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Smart Home": [
    { title: "The Best Mini Wi-Fi Smart Plugs", keyword: "smart plug", mainImgIdx: 6, blockImgIdx: 0 },
    { title: "The Best Multicolor Smart Light Bulbs", keyword: "smart bulb", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Learning Smart Thermostats", keyword: "smart thermostat", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Pregnancy & Nursing": [
    { title: "The Best Organic Cotton Nursing Pillows", keyword: "nursing pillow", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Double Electric Breast Pumps", keyword: "breast pump", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Canvas Backpack Diaper Bags", keyword: "diaper bag", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Baby Gear & Care": [
    { title: "The Best Lightweight Travel Strollers", keyword: "stroller", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best 3-in-1 Convertible Baby Cribs", keyword: "baby crib", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Fragrance-Free Baby Wipes", keyword: "baby wipes", mainImgIdx: 3, blockImgIdx: 0 }
  ],
  "School & Apparel": [
    { title: "The Best Ergonomic Backpacks for Kids", keyword: "kids backpack", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Insulated Bento Box Lunch Boxes", keyword: "lunch box", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Leakproof Stainless Steel Water Bottles", keyword: "kids water bottle", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Toys, Hobbies & Travel": [
    { title: "The Best Cooperative Family Board Games", keyword: "board games", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Educational STEM Toys", keyword: "stem toy", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Three-Wheel Kick Scooters", keyword: "kids scooter", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Apparel & Basics": [
    { title: "The Best Heavyweight Cotton White T-Shirts", keyword: "white t-shirt", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Slim-Fit Raw Denim Jeans", keyword: "jeans", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Cozy Fleece Hoodies", keyword: "hoodie", mainImgIdx: 2, blockImgIdx: 3 }
  ],
  "Underwear & Sleepwear": [
    { title: "The Best 100% Pure Silk Pajamas", keyword: "pajamas", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Breathable Cotton Boxer Briefs", keyword: "boxers", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Moisture-Wicking Merino Wool Socks", keyword: "socks", mainImgIdx: 3, blockImgIdx: 0 }
  ],
  "Shoes & Socks": [
    { title: "The Best Cushioned Walking Sneakers", keyword: "sneakers", mainImgIdx: 2, blockImgIdx: 3 },
    { title: "The Best Carbon-Plate Running Shoes", keyword: "running shoes", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Insulated Rubber Rain Boots", keyword: "rain boots", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Bags & Accessories": [
    { title: "The Best Polarized Wayfarer Sunglasses", keyword: "sunglasses", mainImgIdx: 3, blockImgIdx: 0 },
    { title: "The Best Minimalist Leather Wallets", keyword: "wallet", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Windproof Travel Umbrellas", keyword: "umbrella", mainImgIdx: 1, blockImgIdx: 2 }
  ],
  "Gifts for Grown-Ups": [
    { title: "The Best Practical Gift Ideas for Adults", keyword: "adult gift", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Coffee Lovers Gift Sets", keyword: "coffee gift", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Leather Travel Gifts", keyword: "travel gift", mainImgIdx: 2, blockImgIdx: 0 }
  ],
  "Gifts for Kids": [
    { title: "The Best Creative Art Gifts for Children", keyword: "kids gift", mainImgIdx: 1, blockImgIdx: 2 },
    { title: "The Best Montessori Toys for Toddlers", keyword: "toddler toy", mainImgIdx: 2, blockImgIdx: 0 },
    { title: "The Best Rechargeable Tech Gifts for Teens", keyword: "teens gift", mainImgIdx: 0, blockImgIdx: 1 }
  ],
  "Seasonal Gifts": [
    { title: "The Best Fun White Elephant Exchange Ideas", keyword: "holiday gift", mainImgIdx: 2, blockImgIdx: 0 },
    { title: "The Best Useful Stocking Stuffers", keyword: "stocking stuffer", mainImgIdx: 0, blockImgIdx: 1 },
    { title: "The Best Handmade Mother's Day Gifts", keyword: "mothers day gift", mainImgIdx: 1, blockImgIdx: 2 }
  ]
};

const initialArticles = [];

const initialDeals = [
  {
    id: "deal-1",
    title: "SkinMedica Retinol Complex 1.0 Serum",
    originalPrice: "$95",
    dealPrice: "$77",
    discount: "19% off",
    merchant: "Amazon",
    categoryId: "health-fitness",
    link: "https://www.amazon.com/dp/B00479A93M",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200",
    isEditorPick: true,
    active: true
  },
  {
    id: "deal-2",
    title: "Casabella Wayclean Wide Angle Broom with Dustpan",
    originalPrice: "$18",
    dealPrice: "$15",
    discount: "16% off",
    merchant: "Amazon",
    categoryId: "home-garden",
    link: "https://www.amazon.com/dp/B079C3QCYT",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-3",
    title: "Ilex Studio Avocado Vase",
    originalPrice: "$55",
    dealPrice: "$29",
    discount: "47% off",
    merchant: "Nordstrom",
    categoryId: "home-garden",
    link: "https://www.nordstrom.com",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=200",
    isEditorPick: true,
    active: true
  },
  {
    id: "deal-4",
    title: "Hey Harper Señorita Necklace",
    originalPrice: "$79",
    dealPrice: "$40",
    discount: "49% off",
    merchant: "Hey Harper",
    categoryId: "style",
    link: "https://www.heyharpershop.com",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-5",
    title: "Hey Harper Guardian Necklace",
    originalPrice: "$79",
    dealPrice: "$40",
    discount: "49% off",
    merchant: "Hey Harper",
    categoryId: "style",
    link: "https://www.heyharpershop.com",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-6",
    title: "Scandles Heirloom Tomato Candle",
    originalPrice: "$32",
    dealPrice: "$16",
    discount: "50% off",
    merchant: "Nordstrom",
    categoryId: "home-garden",
    link: "https://www.nordstrom.com",
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-7",
    title: "Scandles Apple Candle",
    originalPrice: "$26",
    dealPrice: "$13",
    discount: "50% off",
    merchant: "Nordstrom",
    categoryId: "home-garden",
    link: "https://www.nordstrom.com",
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-8",
    title: "Wolf Sophia Jewelry Box With Window",
    originalPrice: "$295",
    dealPrice: "$192",
    discount: "35% off",
    merchant: "Nordstrom",
    categoryId: "home-garden",
    link: "https://www.nordstrom.com",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-9",
    title: "Kaasage Eyelash Curler",
    originalPrice: "$10",
    dealPrice: "$6",
    discount: "40% off",
    merchant: "Amazon",
    categoryId: "health-fitness",
    link: "https://www.amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  },
  {
    id: "deal-10",
    title: "Amacool Battery Operated Fan",
    originalPrice: "$30",
    dealPrice: "$19",
    discount: "36% off",
    merchant: "Amazon",
    categoryId: "home-garden",
    link: "https://www.amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1618944847023-3e18cd6459f4?auto=format&fit=crop&q=80&w=200",
    isEditorPick: false,
    active: true
  }
];

const initialSignups = ["doug@reviewsmart.com", "reader@gmail.com"];

let articlesCache = null;
let productsCache = null;
let dealsCache = null;
let categoriesCache = null;

// Database Engine
export const db = {
  _syncTriggered: false,

  async syncFromSupabase() {
    try {
      console.log("[Local API Sync] Starting sync down from VPS database...");

      const res = await fetch('/api/sync-down');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      
      const data = await res.json();
      
      // Mark database as initialized from VPS so we never run auto-seeding again
      localStorage.setItem("wc_articles_seeded_v5", "true");
      
      // 1. Sync Categories
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        localStorage.setItem('wc_categories', JSON.stringify(data.categories));
      }

      // 2. Sync Articles
      if (Array.isArray(data.articles) && data.articles.length > 0) {
        localStorage.setItem('wc_articles', JSON.stringify(data.articles));
        localStorage.setItem('review_articles', JSON.stringify(data.articles));
      }

      // 3. Sync Products
      if (Array.isArray(data.products) && data.products.length > 0) {
        const mappedProds = data.products.map(p => ({
          ...p,
          image: p.imageUrl || p.image || '',
          price: p.basePrice || p.price || '$0.00'
        }));
        localStorage.setItem('wc_products', JSON.stringify(mappedProds));
        localStorage.setItem('review_products', JSON.stringify(mappedProds));
      }

      // 4. Sync Deals
      if (Array.isArray(data.deals)) {
        localStorage.setItem('wc_deals', JSON.stringify(data.deals));
      }

      // 5. Sync Menu Config
      if (data.menu) {
        localStorage.setItem('wc_mega_menu_config', JSON.stringify(data.menu));
      }

      // 6. Sync Homepage Config
      if (data.layout) {
        localStorage.setItem('wc_homepage_layout_config', JSON.stringify(data.layout));
      }

      // 7. Sync Registered Users
      if (Array.isArray(data.users)) {
        localStorage.setItem('wc_registered_users', JSON.stringify(data.users));
      }

      this.invalidateCache();
      window.dispatchEvent(new CustomEvent('supabase-db-synced'));
      console.log("[Local API Sync] All database tables successfully updated from VPS SQLite!");
    } catch (e) {
      console.error("[Local API Sync Error] Sync down failed:", e);
    } finally {
      if (typeof window !== 'undefined') {
        window._isInitializingDb = false;
      }
    }
  },

  init() {
    articlesCache = null;
    productsCache = null;
    dealsCache = null;
    categoriesCache = null;

    if (!this._syncTriggered) {
      if (typeof window !== 'undefined') {
        window._isInitializingDb = true;
      }
      this._syncTriggered = true;
      this.syncFromSupabase();
    }

    // Force reset/update categories if needed to match the 9 categories configuration
    const existingCats = localStorage.getItem("wc_categories");
    if (!existingCats || JSON.parse(existingCats).length !== 9 || !JSON.stringify(existingCats).includes('"id":"web-hosting-software"') || !JSON.stringify(existingCats).includes('"id":"sports-outdoors"')) {
      localStorage.setItem("wc_categories", JSON.stringify(initialCategories));
    }
    
    if (!localStorage.getItem("wc_deals")) {
      localStorage.setItem("wc_deals", JSON.stringify(initialDeals));
    }
    
    if (!localStorage.getItem("wc_products") && !localStorage.getItem("review_products")) {
      localStorage.setItem("wc_products", JSON.stringify(initialProducts));
    }

    if (!localStorage.getItem("wc_signups")) {
      localStorage.setItem("wc_signups", JSON.stringify(initialSignups));
    }

    // Clean up "giảm giá" from all local storage databases to remove it from existing browser data
    try {
      const keysToClean = ['wc_deals', 'review_products', 'wc_products', 'review_articles', 'wc_articles', 'wc_homepage_layout_config', 'wc_mega_menu_config'];
      keysToClean.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          if (raw.toLowerCase().includes("giảm giá") || raw.toLowerCase().includes("giam gia")) {
            let parsed = JSON.parse(raw);
            const cleanObj = (obj) => {
              if (!obj) return obj;
              if (Array.isArray(obj)) {
                return obj.filter(item => {
                  if (typeof item === 'string') {
                    return item.toLowerCase().trim() !== 'giảm giá' && item.toLowerCase().trim() !== 'giam gia';
                  }
                  if (item && typeof item === 'object') {
                    if (item.subCategory && (item.subCategory.toLowerCase().trim() === 'giảm giá' || item.subCategory.toLowerCase().trim() === 'giam gia')) {
                      return false;
                    }
                    if (item.title && (item.title.toLowerCase().trim() === 'giảm giá' || item.title.toLowerCase().trim() === 'giam gia')) {
                      return false;
                    }
                  }
                  return true;
                }).map(item => {
                  if (typeof item === 'string') {
                    return item.replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim();
                  }
                  return cleanObj(item);
                });
              }
              if (typeof obj === 'object') {
                const newObj = {};
                for (let k in obj) {
                  if (typeof obj[k] === 'string') {
                    if (obj[k].toLowerCase().trim() === 'giảm giá' || obj[k].toLowerCase().trim() === 'giam gia') {
                      newObj[k] = '';
                    } else {
                      newObj[k] = obj[k].replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim();
                    }
                  } else {
                    newObj[k] = cleanObj(obj[k]);
                  }
                }
                return newObj;
              }
              return obj;
            };
            const cleaned = cleanObj(parsed);
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        }
      });
    } catch (e) {
      console.error("Clean migration error:", e);
    }

    // Migration: Map old categories/subcategories to the correct ones, and delete invalid seeded articles
    try {
      const keys = ['review_articles', 'wc_articles'];
      keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let changed = false;
            
            let migrated = parsed.map(art => {
              // 1. If category is "Sleep", map to "Home & Garden" / "Sleep"
              if (art.category === "Sleep") {
                art.category = "Home & Garden";
                art.subCategory = "Sleep";
                art.categoryId = "home-garden";
                changed = true;
              }
              // 2. If category is "Office", map to "Home & Garden" / "Office"
              if (art.category === "Office") {
                art.category = "Home & Garden";
                art.subCategory = "Office";
                art.categoryId = "home-garden";
                changed = true;
              }
              // 3. If category is "Outdoors & Travel" or "Pets", map to "Home & Garden" / "Garden & Outdoors"
              if (art.category === "Outdoors & Travel" || art.category === "Pets") {
                art.category = "Home & Garden";
                art.subCategory = "Garden & Outdoors";
                art.categoryId = "home-garden";
                changed = true;
              }
              // 4. If category is "Kitchen & Dining", map to "Kitchen"
              if (art.category === "Kitchen & Dining") {
                art.category = "Kitchen";
                art.categoryId = "kitchen";
                changed = true;
              }
              
              // 5. Ensure category is one of the 9 allowed names
              const allowedNames = ["Home & Garden", "Kitchen", "Health & Lifestyle", "Tech", "Baby & Kid", "Style", "Gifts", "Web Hosting & Software", "Sports & Outdoors"];
              if (!allowedNames.includes(art.category)) {
                art.category = "Home & Garden";
                art.categoryId = "home-garden";
                changed = true;
              }
              
              // 6. Ensure categoryId is correct for the category
              const catMap = {
                "Home & Garden": "home-garden",
                "Kitchen": "kitchen",
                "Health & Lifestyle": "health-fitness",
                "Tech": "electronics",
                "Baby & Kid": "baby-kid",
                "Style": "style",
                "Gifts": "gifts",
                "Web Hosting & Software": "web-hosting-software",
                "Sports & Outdoors": "sports-outdoors"
              };
              if (catMap[art.category] && art.categoryId !== catMap[art.category]) {
                art.categoryId = catMap[art.category];
                changed = true;
              }
              
              return art;
            });
            
            // Clean up junk intro text from localStorage
            migrated = migrated.map(art => {
              if (art.intro && (art.intro.toLowerCase().trim() === 'jvjgjgv' || art.intro.toLowerCase().trim() === 'jv' || /^[jvg\s]+$/.test(art.intro.toLowerCase().trim()))) {
                art.intro = '';
                changed = true;
              }
              return art;
            });

            if (changed) {
              localStorage.setItem(key, JSON.stringify(migrated));
            }
          }
        }
      });
    } catch(e) {
      console.error("Migration error:", e);
    }

    // Ensure every subcategory has exactly 3 articles for testing
    // ONLY run if the database has never been seeded before
    try {
      const isFirstTimeSeeded = localStorage.getItem("wc_articles_seeded_v5");
      if (!isFirstTimeSeeded) {
        localStorage.setItem("wc_articles_seeded_v5", "true");
        
        let currentArticles = [];
        const saved = localStorage.getItem('review_articles') || localStorage.getItem('wc_articles');
        if (saved) {
          currentArticles = JSON.parse(saved);
        }
        if (!Array.isArray(currentArticles)) {
          currentArticles = [];
        }

        const originalLength = currentArticles.length;

        // 1. Deduplicate by ID to clean up any duplicate seed articles
        const uniqueMap = new Map();
        let hasDuplicates = false;
        currentArticles.forEach(art => {
          if (!art.id) return;
          if (uniqueMap.has(art.id)) {
            hasDuplicates = true;
            const existing = uniqueMap.get(art.id);
            const isExistingSeeded = existing.title && existing.title.startsWith('The 3 Best');
            const isNewSeeded = art.title && art.title.startsWith('The 3 Best');
            if (isExistingSeeded && !isNewSeeded) {
              uniqueMap.set(art.id, art);
            }
          } else {
            uniqueMap.set(art.id, art);
          }
        });
        currentArticles = Array.from(uniqueMap.values());

        const counts = {};
        currentArticles.forEach(art => {
          const key = `${(art.category || '').toLowerCase().trim()}|${(art.subCategory || '').toLowerCase().trim()}`;
          counts[key] = (counts[key] || 0) + 1;
        });

        // Find the maximum numeric ID to prevent clashes
        let maxId = 9000;
        currentArticles.forEach(art => {
          if (art.id && art.id.startsWith('POST-')) {
            const num = parseInt(art.id.split('-')[1]);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        });
        let idCounter = maxId;

        const generated = [];

        initialCategories.forEach(cat => {
          const subList = cat.subcategories || [];
          subList.forEach(sub => {
            const key = `${cat.name.toLowerCase().trim()}|${sub.toLowerCase().trim()}`;
            const existingCount = counts[key] || 0;
            const needed = 3 - existingCount;

            // Look up template configurations
            const templates = subcategoryTemplates[sub] || [
              { title: `The 3 Best ${sub} of 2026 (Pick #1)`, keyword: sub, mainImgIdx: 0, blockImgIdx: 1 },
              { title: `The 3 Best ${sub} of 2026 (Pick #2)`, keyword: sub, mainImgIdx: 1, blockImgIdx: 2 },
              { title: `The 3 Best ${sub} of 2026 (Pick #3)`, keyword: sub, mainImgIdx: 2, blockImgIdx: 3 }
            ];

            for (let i = 1; i <= needed; i++) {
              idCounter++;
              const id = `POST-${idCounter}`;
              
              // Get template or fallback
              const templateIndex = ((i + existingCount) - 1) % templates.length;
              const template = templates[templateIndex];
              
              const title = template.title || `The 3 Best ${sub} of 2026 (Pick #${i + existingCount})`;
              const keyword = template.keyword || sub;

              const slug = title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
              
              // Choose image list based on category
              const imgList = categoryImages[cat.id] || genericImages;
              const mainImgIdx = template.mainImgIdx ?? (templateIndex % imgList.length);
              const blockImgIdx = template.blockImgIdx ?? ((templateIndex + 1) % imgList.length);
              
              const articleImage = imgList[mainImgIdx % imgList.length];
              const blockImage = imgList[blockImgIdx % imgList.length];

              const textBlockValue = `## Why you should trust us\n\nWe spent over 40 hours researching and testing the best ${sub} on the market to find the ones that deliver the highest value, durability, and performance.\n\nOur editor's review covers all the critical features you need to consider before making a purchase.`;
              
              generated.push({
                id,
                title,
                slug,
                category: cat.name,
                subCategory: sub,
                categoryId: cat.id,
                status: 'Published',
                author: ['Staff Writer', 'Alice Smith', 'Bob Johnson'][templateIndex % 3],
                image: articleImage,
                intro: `Looking for the absolute best ${sub.toLowerCase()}? We've tested and reviewed the top options for you in this comprehensive guide.`,
                date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                blocks: [
                  {
                    id: `block-${id}-1`,
                    type: 'text',
                    value: textBlockValue,
                    image: blockImage,
                    refLink: `https://www.amazon.com/dp/B08X17X${idCounter}`,
                    ctaTitle: `Top Choice: The Premium ${keyword}`,
                    ctaDesc: `This outstanding ${keyword.toLowerCase()} offers peak performance, top-tier build quality, and has been highly rated by our editors after extensive tests.`
                  }
                ],
                clicks: 0
              });
            }
          });
        });

        if (generated.length > 0 || hasDuplicates || currentArticles.length !== originalLength) {
          const merged = [...currentArticles, ...generated];
          localStorage.setItem('review_articles', JSON.stringify(merged));
          localStorage.setItem('wc_articles', JSON.stringify(merged));
        }
      }
    } catch (e) {
      console.error("Error auto-populating subcategory test articles:", e);
    }
  },

  getCategories() {
    if (categoriesCache) return categoriesCache;
    this.init();
    categoriesCache = JSON.parse(localStorage.getItem("wc_categories"));
    return categoriesCache;
  },

  saveCategory(cat) {
    categoriesCache = null;
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === cat.id);
    if (index > -1) {
      categories[index] = cat;
    } else {
      categories.push(cat);
    }
    localStorage.setItem("wc_categories", JSON.stringify(categories));
    syncArrayToSupabase('wc_categories', categories);
    return categories;
  },

  deleteCategory(id) {
    categoriesCache = null;
    const categories = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem("wc_categories", JSON.stringify(categories));
    syncArrayToSupabase('wc_categories', categories);
    return categories;
  },

  getProducts() {
    if (productsCache) return productsCache;
    this.init();
    const saved = localStorage.getItem('review_products');
    let list = [];
    if (saved) {
      list = JSON.parse(saved);
    } else {
      const wcSaved = localStorage.getItem('wc_products');
      if (wcSaved) {
        localStorage.setItem('review_products', wcSaved);
        list = JSON.parse(wcSaved);
      } else {
        list = JSON.parse(localStorage.getItem("wc_products")) || [];
      }
    }

    if (!saved) {
      localStorage.setItem('review_products', JSON.stringify(list));
      localStorage.setItem('wc_products', JSON.stringify(list));
    }

    productsCache = list;
    return list;
  },

  getProductsForArticle(articleId, articleTitle, categoryId) {
    const products = this.getProducts().filter(p => p.articleId === articleId);
    if (products.length > 0) return products;

    // Fallback dynamic products generator for editorial review pages
    const isLaptops = articleTitle.toLowerCase().includes("laptop");
    const isCamera = articleTitle.toLowerCase().includes("camera");
    const isVacuum = articleTitle.toLowerCase().includes("vacuum");
    const isModem = articleTitle.toLowerCase().includes("modem");
    const isSheets = articleTitle.toLowerCase().includes("sheets");
    const isStove = articleTitle.toLowerCase().includes("stove");
    
    let generated = [];
    if (isLaptops) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Apple MacBook Air 13-inch (M3)",
          tagline: "The best laptop for most people",
          shortDescription: "With its stellar battery life, superb performance, quiet fanless design, and gorgeous screen, the M3 MacBook Air is the top choice for daily tasks, students, and professionals alike.",
          price: "$1,099",
          merchant: "Amazon",
          rating: 4.8,
          reviewsCount: 2310,
          image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["Outstanding 18-hour battery life", "Fast M3 processor", "Thin, lightweight profile", "Excellent keyboard and trackpad"],
          cons: ["Supports only two external displays", "Base model starts with 8GB RAM"]
        },
        {
          id: `${articleId}-p2`,
          articleId,
          badge: "Runner-up",
          badgeColor: "bg-gray-800",
          name: "HP Pavilion Plus 14",
          tagline: "The best Windows laptop",
          shortDescription: "For those who prefer Windows, the HP Pavilion Plus offers a vibrant OLED display, excellent keyboard, robust performance, and a sleek aluminum chassis at a competitive price.",
          price: "$849",
          merchant: "HP Store",
          rating: 4.5,
          reviewsCount: 750,
          image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.hp.com",
          pros: ["Beautiful 120Hz OLED screen", "Great value for specs", "Comes with 16GB RAM base", "Rich array of ports"],
          cons: ["Battery life is average (6-7 hours)", "Webcam cover feels cheap"]
        }
      ];
    } else if (isCamera) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Fujifilm X-T50 Mirrorless Camera",
          tagline: "The best everyday creative camera",
          shortDescription: "A compact, retro-styled camera body packing a massive 40MP sensor, advanced autofocus tracking, and a dedicated Film Simulation dial that lets you create stunning photos without editing.",
          price: "$1,399",
          merchant: "Amazon",
          rating: 4.7,
          reviewsCount: 180,
          image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["Stunning retro look and feel", "40.2 Megapixel sensor", "Dedicated film simulation wheel", "7 stops of in-body stabilization"],
          cons: ["Electronic viewfinder is small", "Battery life could be better"]
        }
      ];
    } else if (isVacuum) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Dyson V15 Detect Cordless Vacuum",
          tagline: "The ultimate cleaning power",
          shortDescription: "An incredibly powerful cordless stick vacuum featuring a laser dust detector, automatically adjusting suction power based on floor type, and a runtime of up to 60 minutes.",
          price: "$649",
          merchant: "Amazon",
          rating: 4.8,
          reviewsCount: 3820,
          image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["Laser reveals microscopic dust", "Incredible suction power", "LCD screen displays particle stats", "Easy to empty"],
          cons: ["Expensive", "Trigger lock is absent"]
        }
      ];
    } else if (isModem) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Arris Surfboard SB8200 Cable Modem",
          tagline: "Widely compatible and fast",
          shortDescription: "Featuring DOCSIS 3.1 technology, dual gigabit ethernet ports, and support for multi-gig speeds, this modem is compatible with Comcast, Cox, Spectrum, and more.",
          price: "$119",
          merchant: "Amazon",
          rating: 4.7,
          reviewsCount: 8900,
          image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["DOCSIS 3.1 speeds", "Supports link aggregation", "Quiet fanless design", "Compact form factor"],
          cons: ["Gets warm during heavy use"]
        }
      ];
    } else if (isSheets) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Target Threshold 400 Thread Count Organic Sheet Set",
          tagline: "The best budget cotton sheets",
          shortDescription: "Made of 100% organic cotton, these sheets are breathable, soft, and durable. They feature double-elastic corners that stay secure on thick mattresses.",
          price: "$55",
          merchant: "Target",
          rating: 4.6,
          reviewsCount: 12500,
          image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.target.com",
          pros: [" double-elastic grip stays in place", "Soft organic cotton percale", "Incredibly affordable", "Doesn't shrink in hot water"],
          cons: ["Wrinkles easily out of the dryer"]
        }
      ];
    } else if (isStove) {
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: "Camp Chef Everest 2X Stove",
          tagline: "The best camping stove",
          shortDescription: "A heavy-duty two-burner stove that outputs 20,000 BTUs per burner. It has excellent simmer control, a built-in matchless igniter, and handles heavy winds effortlessly.",
          price: "$189",
          merchant: "Amazon",
          rating: 4.8,
          reviewsCount: 1420,
          image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["Powerful burners boil water in minutes", "Superb simmer flame control", "Sturdy stainless steel construct", "Stays lit in high wind"],
          cons: ["Heavy and bulky for tight packing", "No carry bag included"]
        }
      ];
    } else {
      // General fallback products generator
      generated = [
        {
          id: `${articleId}-p1`,
          articleId,
          badge: "Our pick",
          badgeColor: "bg-reviewsmart-brand",
          name: `ReviewSmart Select ${articleTitle.replace("The Best ", "").replace("Our Favorite ", "")} Pick`,
          tagline: "The best option for most buyers",
          shortDescription: `After hours of research and testing, we found this to be the most reliable, durable, and cost-effective solution for ${articleTitle.toLowerCase()}. It stands out for its high build quality and ease of use.`,
          price: "$129",
          merchant: "Amazon",
          rating: 4.7,
          reviewsCount: 520,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.amazon.com",
          pros: ["High quality build", "Easy to operate", "Excellent warranty", "Great value"],
          cons: ["Slightly expensive", "Fewer color choices"]
        },
        {
          id: `${articleId}-p2`,
          articleId,
          badge: "Budget pick",
          badgeColor: "bg-emerald-700",
          name: `Eco-Value ${articleTitle.replace("The Best ", "").replace("Our Favorite ", "")} Alternative`,
          tagline: "Great performance for less money",
          shortDescription: `If you want to save money while still getting 90% of the performance of our top pick, this budget alternative is the best choice. It misses some premium features but covers all the basics perfectly.`,
          price: "$59",
          merchant: "Walmart",
          rating: 4.4,
          reviewsCount: 310,
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
          buyUrl: "https://www.walmart.com",
          pros: ["Exceptional value", "Lightweight design", "Simple controls"],
          cons: ["Plastic construction details", "shorter lifespan under heavy use"]
        }
      ];
    }

    return generated;
  },

  saveProduct(prod) {
    productsCache = null;
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === prod.id);
    if (index > -1) {
      products[index] = prod;
    } else {
      products.push(prod);
    }
    localStorage.setItem("review_products", JSON.stringify(products));
    localStorage.setItem("wc_products", JSON.stringify(products));
    syncArrayToSupabase('wc_products', products);
    return products;
  },

  deleteProduct(id) {
    productsCache = null;
    const products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem("review_products", JSON.stringify(products));
    localStorage.setItem("wc_products", JSON.stringify(products));
    syncArrayToSupabase('wc_products', products);
    return products;
  },

  getArticles() {
    if (articlesCache) return articlesCache;
    this.init();
    const saved = localStorage.getItem('review_articles');
    let list = [];
    if (saved) {
      list = JSON.parse(saved);
    } else {
      const wcSaved = localStorage.getItem('wc_articles');
      if (wcSaved) {
        localStorage.setItem('review_articles', wcSaved);
        list = JSON.parse(wcSaved);
      } else {
        list = JSON.parse(localStorage.getItem("wc_articles")) || [];
      }
    }

    let listChanged = false;

    // Auto-migrate/repair any articles that are missing slug or categoryId
    const mapCategoryToId = (categoryName) => {
      const mapping = {
        "Home & Garden": "home-garden",
        "Kitchen": "kitchen",
        "Kitchen & Dining": "kitchen",
        "Tech": "electronics",
        "Electronics": "electronics",
        "Health & Lifestyle": "health-fitness",
        "Health & Fitness": "health-fitness",
        "Baby & Kid": "baby-kid",
        "Style": "style",
        "Apparel": "style",
        "Gifts": "gifts",
        "Pets": "pets",
        "Office": "office",
        "Sleep": "sleep",
        "Web Hosting & Software": "web-hosting-software",
        "Sports & Outdoors": "sports-outdoors"
      };
      return mapping[categoryName] || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    };

    let filteredList = list.filter(art => {
      const title = (art.title || '').trim().toLowerCase();
      const cat = (art.category || '').trim().toLowerCase();
      const sub = (art.subCategory || '').trim().toLowerCase();
      return title !== 'website' && title !== 'ảnh 2' && title !== 'giảm giá' && title !== 'giam gia' && cat !== 'giảm giá' && cat !== 'giam gia' && sub !== 'giảm giá' && sub !== 'giam gia';
    });

    const repaired = filteredList.map((art, idx) => {
      let itemChanged = false;
      if (!art.slug && art.title) {
        art.slug = art.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        itemChanged = true;
      } else if (art.slug && (art.slug.endsWith('-') || art.slug.startsWith('-'))) {
        art.slug = art.slug.replace(/(^-|-$)/g, '');
        itemChanged = true;
      }
      if (!art.categoryId && art.category) {
        art.categoryId = mapCategoryToId(art.category);
        itemChanged = true;
      }
      if (!art.createdAt) {
        art.createdAt = Date.now() - (filteredList.length - idx) * 60000;
        itemChanged = true;
      }
      if (art.intro && (art.intro.toLowerCase().trim() === 'jvjgjgv' || art.intro.toLowerCase().trim() === 'jv')) {
        art.intro = '';
        itemChanged = true;
      }
      if (art.scheduledAt) {
        const schedDatePart = art.scheduledAt.split('T')[0].split(' ')[0];
        if (schedDatePart && schedDatePart.length === 10 && art.date !== schedDatePart) {
          art.date = schedDatePart;
          itemChanged = true;
        }
      }
      if (art.status === 'Scheduled') {
        const schedTime = art.scheduledAt ? new Date(art.scheduledAt).getTime() : (art.date ? new Date(art.date).getTime() : null);
        if (schedTime && !isNaN(schedTime) && Date.now() >= schedTime) {
          art.status = 'Published';
          if (art.scheduledAt) {
            art.date = art.scheduledAt.split('T')[0].split(' ')[0];
          }
          itemChanged = true;
        }
      }
      if (itemChanged) listChanged = true;
      return art;
    });

    // Sort by release date descending (newest first), then by createdAt ascending (earlier time first)
    repaired.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    if (listChanged || !saved || list.length !== filteredList.length) {
      localStorage.setItem('review_articles', JSON.stringify(repaired));
      localStorage.setItem('wc_articles', JSON.stringify(repaired));
    }

    articlesCache = repaired;
    return repaired;
  },

  getArticle(slug) {
    const articles = this.getArticles();
    const art = articles.find(a => a.slug === slug || a.id === slug);
    if (art && !art.contentHtml) {
      art.contentHtml = `
        <h2>Why you should trust us</h2>
        <p>At ReviewSmart, our reviews are fully independent. Our writers and editors spend days, weeks, and sometimes months researching and testing products to find the absolute best options. We only recommend products that we have vetted through hands-on testing or deep research.</p>
        
        <h2>Who this is for</h2>
        <p>This buying guide is for anyone looking for reliable recommendations on <strong>${art.title.toLowerCase()}</strong>. If you are tired of reading endless fake reviews online and want an expert recommendation that cuts through the noise, this guide is for you.</p>
        
        <h2>How we picked and tested</h2>
        <p>We start by analyzing the market, noting customer review scores, and talking to industry insiders. We then procure the top contenders and subject them to normal, everyday household use. We evaluate them based on build quality, durability, ease of setup, ergonomics, and cost-to-performance ratio.</p>
      `;
    }
    return art;
  },

  saveArticle(art) {
    articlesCache = null;
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === art.id);
    const toSave = { ...art, createdAt: art.createdAt || Date.now() };
    if (index > -1) {
      articles[index] = toSave;
    } else {
      articles.push(toSave);
    }
    // Sort: date descending, then createdAt ascending
    articles.sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    localStorage.setItem("review_articles", JSON.stringify(articles));
    localStorage.setItem("wc_articles", JSON.stringify(articles));
    syncArrayToSupabase('wc_articles', articles);
    return articles;
  },

  deleteArticle(id) {
    articlesCache = null;
    deleteRowInSupabase('wc_articles', id);
    const articles = this.getArticles().filter(a => a.id !== id);
    localStorage.setItem("review_articles", JSON.stringify(articles));
    localStorage.setItem("wc_articles", JSON.stringify(articles));
    return articles;
  },

  getDeals() {
    if (dealsCache) return dealsCache;
    this.init();
    try {
      const deals = JSON.parse(localStorage.getItem("wc_deals"));
      dealsCache = Array.isArray(deals) ? deals : [];
      return dealsCache;
    } catch(e) {
      return [];
    }
  },

  saveDeal(deal) {
    dealsCache = null;
    const deals = this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index > -1) {
      deals[index] = deal;
    } else {
      deals.push(deal);
    }
    localStorage.setItem("wc_deals", JSON.stringify(deals));
    syncArrayToSupabase('wc_deals', deals);
    return deals;
  },

  deleteDeal(id) {
    dealsCache = null;
    const deals = this.getDeals().filter(d => d.id !== id);
    localStorage.setItem("wc_deals", JSON.stringify(deals));
    syncArrayToSupabase('wc_deals', deals);
    return deals;
  },

  getNewsletterSignups() {
    this.init();
    return JSON.parse(localStorage.getItem("wc_signups"));
  },

  addNewsletterSignup(email) {
    const signups = this.getNewsletterSignups();
    if (!signups.includes(email)) {
      signups.push(email);
      localStorage.setItem("wc_signups", JSON.stringify(signups));
    }
    return signups;
  },

  deleteSignup(email) {
    const signups = this.getNewsletterSignups().filter(e => e !== email);
    localStorage.setItem("wc_signups", JSON.stringify(signups));
    return signups;
  },

  resetDatabase() {
    localStorage.removeItem("wc_categories");
    localStorage.removeItem("wc_products");
    localStorage.removeItem("wc_articles");
    localStorage.removeItem("wc_deals");
    localStorage.removeItem("wc_signups");
    this.init();
  },

  invalidateCache() {
    articlesCache = null;
    productsCache = null;
    dealsCache = null;
    categoriesCache = null;
  }
};

export const isArticlePublished = (art) => {
  if (!art) return false;
  // Draft status is always hidden from public views
  if (art.status === 'Draft') return false;
  // Scheduled status: check if current time has reached or passed scheduledAt or date
  if (art.status === 'Scheduled') {
    if (!art.scheduledAt) return false;
    const now = new Date();
    const schedDate = new Date(art.scheduledAt);
    if (isNaN(schedDate.getTime())) return false;
    return now >= schedDate;
  }
  // Default Published or empty status
  return true;
};
