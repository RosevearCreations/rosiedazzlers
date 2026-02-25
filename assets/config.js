// assets/config.js
// Central config for assets + pricing + package imagery.
// Assumes your R2 custom domain is: https://assets.rosiedazzlers.ca
// and your objects are organized like:
//   brand/...
//   packages/...
//   products/...
//   systems/...

export const ASSETS_BASE = "https://assets.rosiedazzlers.ca";

export const PATHS = {
  brand: "brand",
  packages: "packages",
  products: "products",
  systems: "systems",
};

export const CONTACT = {
  phone: "226-752-7613",
  email: "info@rosiedazzlers.ca",
  serviceArea: "Norfolk & Oxford Counties",
};

export function assetUrl(folder, filename) {
  return `${ASSETS_BASE}/${folder}/${encodeURIComponent(filename)}`.replaceAll("%2F", "/");
}

// Must match your backend PRICING keys in functions/api/checkout.js
// Values are cents (CAD) from your CarPrice2025 chart.
export const PRICING = {
  premium_wash: {
    label: "Premium Wash",
    subtitle: "Exterior wash + quick finish",
    small: 8500,
    mid: 10500,
    oversize: 12500,
  },
  basic_detail: {
    label: "Basic Detail",
    subtitle: "Basic interior clean",
    small: 11500,
    mid: 13500,
    oversize: 17000,
  },
  complete_detail: {
    label: "Complete Detail",
    subtitle: "Our most popular",
    small: 31900,
    mid: 36900,
    oversize: 41900,
  },
  interior_detail: {
    label: "Interior Detail",
    subtitle: "Full interior detailing",
    small: 19500,
    mid: 22000,
    oversize: 24500,
  },
  exterior_detail: {
    label: "Exterior Detail",
    subtitle: "Full exterior detailing",
    small: 19500,
    mid: 22000,
    oversize: 24500,
  },
};

// Package images (from RosieDazzlersPackages.zip filenames)
// These should exist in R2 under: packages/<filename>
export const PACKAGE_MEDIA = {
  premium_wash: {
    small: "PremiumExternalWash.png",
    mid: "PremiumExternalWashMidSize.png",
    oversize: "PremiumExternalWashLargeSizeExotic.png",
  },
  basic_detail: {
    small: "BasicInteriorDetailSmallSize.png",
    mid: "BasicInteriorDetailMidSize.png",
    oversize: "BasicInteriorDetailExotics.png",
  },
  complete_detail: {
    small: "CompleteDetailSmallCars.png",
    mid: "CompleteDetailMidSizelCars.png",
    oversize: "CompleteDetailOverSizeExoticCars.png",
  },
  interior_detail: {
    small: "FullInteriorDetailSmallCars.png",
    mid: "FullInteriorDetailMidSuvCars.png",
    oversize: "FullInteriorDetailLargeExoticCars.png",
  },
  exterior_detail: {
    small: "FullExteriorDetailSmallSizeCars.png",
    mid: "FullExteriorDetailMidSizeCars.png",
    oversize: "FullExteriorDetailLargeExoticCars.png",
  },
};

// Charts (also in your packages zip)
export const CHARTS = {
  price: "CarPrice2025.PNG",
  includes: "CarPriceDetails2025.PNG",
  size: "CarSizeChart.PNG",
  // optional size examples (if you want)
  size_small: "SmallCar.png",
  size_mid: "MidSizedCars.png",
  size_oversize: "ExoticLargeSizedCars.png",
};

// Must match your backend ADDONS keys in functions/api/checkout.js
export const ADDONS = {
  engine_bay: { label: "Engine Bay Detail", cents: 11900 },
  pet_hair: { label: "Pet Hair Removal", cents: 8900 },
  odor_treatment: { label: "Odour Treatment", cents: 12900 },
};

// Must match backend deposit rule
export function calcDepositCents(packageCode) {
  return packageCode === "premium_wash" || packageCode === "basic_detail" ? 5000 : 10000;
}

export function money(cents) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format((cents || 0) / 100);
}
