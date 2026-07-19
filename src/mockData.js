export const toolkits = [
  {
    id: "anvil",
    badge: "Our pick",
    badgeColor: "bg-reviewsmart-brand",
    name: "Anvil Homeowner’s Tool Set",
    tagline: "The best basic tool kit",
    shortDescription: "This kit has all of the essentials in a small package, making it the best choice for common home repairs and upgrades.",
    longDescription: "The Anvil set provides the necessary items without useless filler inflating the tool count, which was a common flaw we saw in competitors’ kits. Beyond a hammer, tape measure, utility knife, screwdriver, and hex wrenches, as well as adequate versions of other tools we considered essential, the Anvil kit has one of the best adjustable wrenches we found in any kit. It also has one of the most compact cases we found. If you need something small and basic to keep in a closet and use for occasional home repairs, this kit is a satisfying value, and it should last for years.",
    price: "$45",
    merchant: "The Home Depot",
    rating: 4.8,
    reviewsCount: 1420,
    image: "/anvil_tool_set.png",
    pieces: 76,
    caseType: "Hard Plastic Book-style Case (13” x 10.75” x 3”)",
    buyUrl: "https://www.homedepot.com/",
    pros: [
      "Compact, laptop-sized case ideal for closet storage",
      "Exceptional adjustable wrench with comfortable padded grip",
      "No useless filler to inflate count",
      "Includes 22 hex keys (both SAE and Metric sizes)"
    ],
    cons: [
      "Extremely flimsy and inaccurate plastic torpedo level",
      "Low-quality clamps and scissors that break easily",
      "Pressure-fitted slots can occasionally drop tools when opening"
    ],
    toolsIncluded: {
      hammer: "Yes (8 oz Fiberglass claw hammer)",
      tapeMeasure: "Yes (12-foot, rubberized sheath)",
      screwdriver: "Yes (Driver handle + 30 bits)",
      hexKeys: "Yes (11 Metric & 11 SAE L-wrenches)",
      pliers: "Yes (6-inch slip-joint with padded grips)",
      adjustableWrench: "Yes (8-inch padded, opens to 1.1”)",
      level: "Yes (Flimsy 9-inch plastic level)",
      utilityKnife: "Yes (Standard utility knife + 5 replacement blades)",
      clamps: "Yes (4 small spring clamps)",
      scissors: "Yes (Comfort grip household scissors)"
    }
  },
  {
    id: "workpro",
    badge: "Runner-up",
    badgeColor: "bg-gray-800",
    name: "WorkPro 100-Piece Kitchen Drawer Tool Kit",
    tagline: "A more limited selection of good-quality tools",
    shortDescription: "The quality of these tools is the same as for tools in our main pick, but the selection of tools isn’t as good.",
    longDescription: "If the Anvil is sold out or unavailable, the WorkPro contains nearly all of the same tools at the same level of quality. It also comes with a nice zippered case that’s equipped with straps to secure the tools. The drawbacks are that the kit offers only metric hex wrenches (and not the common SAE sizes), and it lacks any kind of wide-jaw pliers. So in situations where you need to hold a nut and a bolt simultaneously, the WorkPro is much more limited than the Anvil kit.",
    price: "$34",
    merchant: "Amazon",
    rating: 4.6,
    reviewsCount: 890,
    image: "/workpro_tool_kit.png",
    pieces: 100,
    caseType: "Zippered Soft-sided Case with straps",
    buyUrl: "https://www.amazon.com/",
    pros: [
      "Flexible zippered soft case is easier to wedge into tight storage",
      "Elastic loops and Velcro straps hold tools securely without drops",
      "Same grade tool steel as our top pick",
      "Extra interior room to store loose screws or picture hanging hooks"
    ],
    cons: [
      "Metric-only hex keys (renders standard US repairs difficult)",
      "Lacks slip-joint or wide-jaw pliers for nut-and-bolt assembly",
      "Shorter 10-foot tape measure (compared to Anvil's 12-foot)"
    ],
    toolsIncluded: {
      hammer: "Yes (8 oz Claw hammer)",
      tapeMeasure: "Yes (10-foot standard tape)",
      screwdriver: "Yes (Driver handle + 40 bits)",
      hexKeys: "Yes (Metric-only hex keys)",
      pliers: "Yes (Needle-nose pliers only)",
      adjustableWrench: "Yes (8-inch standard adjustable wrench)",
      level: "Yes (9-inch magnetic level)",
      utilityKnife: "Yes (Utility knife)",
      clamps: "No",
      scissors: "Yes (Kitchen scissors)"
    }
  }
];

export const competitors = [
  {
    name: "Tinkr Home Essential Kit",
    issue: "Fashionable look and nice feel, but lacks the essential second wrench (or pliers) for double-sided nut-and-bolt scenarios. Also contains very few total tools.",
    pieces: 35,
    price: "$40"
  },
  {
    name: "Harbor Freight Pittsburgh 146-piece",
    issue: "Includes too many redundant sockets and socket-drive accessories, inflating the size and weight of the box. Difficult to store in a standard apartment closet.",
    pieces: 146,
    price: "$55"
  },
  {
    name: "AmazonBasics 65-Piece Set",
    issue: "Lacks a second tool for nut-and-bolt scenarios. Uses cheaper plastic injection handles that tend to slip under high torque.",
    pieces: 65,
    price: "$32"
  },
  {
    name: "Stanley 65-Piece Homeowner's Kit",
    issue: "Has only a very small, incomplete socket set and simple slip-joint pliers. Lacks an adjustable wrench, meaning it fails the versatility test for simple pipe fittings.",
    pieces: 65,
    price: "$49"
  }
];

export const individualPicks = [
  {
    category: "Hammer",
    name: "Estwing 16 oz. Curved Claw Hammer",
    reason: "Forged in one piece of steel, offering unmatched balance and durability. The shock-reduction grip is comfortable for sustained projects.",
    price: "$28"
  },
  {
    category: "Screwdriver",
    name: "Megapro 13-in-1 Multi-Bit Screwdriver",
    reason: "Smooth ratcheting mechanism and secure bit storage inside the handle. Pull-out cartridge holds 12 double-ended professional-grade bits.",
    price: "$32"
  },
  {
    category: "Tape Measure",
    name: "Stanley 25-Foot PowerLock Tape Measure",
    reason: "Classic durable design with rigid blade standout and easy lock slide. Made to withstand multiple high-altitude drops onto concrete.",
    price: "$19"
  }
];
