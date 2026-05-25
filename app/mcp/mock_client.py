"""Deterministic in-memory MCP client for the hackathon PoC.

Catalog seeded from Zoho Commerce MCP (org 49826422) via list_all_products
and get_a_product. Product identity, pricing, descriptions, categories,
inventory, and specifications reflect live Commerce data. Sales, returns,
and promotions are synthetic stand-ins until those MCP tools are wired
into the real client.
"""
from copy import deepcopy


_CATALOG: dict[str, dict] = {
    # ---------- Laptops (org 49826422) ----------
    '9000000008013': {
        'item_id': '9000000008013',
        'item_name': 'MacBook Neo',
        'description': "The MacBook Neo redefines Apple's entry-level laptop lineup by prioritizing affordability without sacrificing core build quality. At its heart is the A18 Pro processor, marking a unique shift by using a high-end smartphone chip to power a macOS desktop environment. This configuration delivers highly efficient performance for web browsing, document editing, and media streaming, while pushing battery life up to 16 hours. To achieve its budget-friendly price tag, Apple stripped away several premium hardware luxuries. The Neo features a traditional mechanical click trackpad instead of a haptic Force Touch trackpad, omits a backlit keyboard and Touch ID sensor, and limits one of its two USB-C ports to slower USB 2.0 transfer speeds. Despite these compromises, it retains the modern, ultra-thin aesthetic of the premium MacBook Air line, complete with a vibrant 13.6-inch Liquid Retina display and a durable aluminum unibody chassis. It serves as a highly portable, reliable gateway device for users tied to the Apple ecosystem who only require baseline computing power.",
        'rate': 699.0,
        'mrp': 754.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Apple',
            'processor_brand': 'Apple',
            'cpu_architecture': 'ARM64',
            'processor': 'A18 Pro',
            'core_count': '6',
            'weight': '2.67 lb',
            'dimensions': '11.97 x 8.46 x 0.44 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Apple',
                    'CPU Architecture': 'ARM64',
                    'Processor': 'A18 Pro',
                    'Core count': '6',
                },
            },
        },
        'inventory': {
            'stock_on_hand': 38,
            'available_stock': 38,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 320,
            'units_sold_7d': 78,
        },
        'returns': {
            'quantity_returned_30d': 10,
            'return_rate': 0.031,
        },
        'promotions': None,
    },
    '9000000008049': {
        'item_id': '9000000008049',
        'item_name': 'MacBook Air 13 M3',
        'description': 'The MacBook Air 13-inch with Apple M3 chip delivers exceptional battery life, silent fanless operation, and strong everyday productivity performance. It features a lightweight aluminum chassis, Liquid Retina display, MagSafe charging, and support for Apple Intelligence features.',
        'rate': 1099.0,
        'mrp': 1186.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Apple',
            'processor_brand': 'Apple',
            'cpu_architecture': 'ARM64',
            'processor': 'M3',
            'core_count': '8',
            'weight': '2.7 lb',
            'dimensions': '11.97 x 8.46 x 0.44 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Apple',
                    'CPU Architecture': 'ARM64',
                    'Processor': 'M3',
                    'Core count': '8',
                },
            },
            'sku': 'MBA13-M3-256',
            'part_number': 'MRXV3LL/A',
        },
        'inventory': {
            'stock_on_hand': 16,
            'available_stock': 16,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 215,
            'units_sold_7d': 51,
        },
        'returns': {
            'quantity_returned_30d': 4,
            'return_rate': 0.018,
        },
        'promotions': {
            'coupon_code': 'APPLE10',
            'discount_by': 'percentage',
            'discount_value': 10.0,
        },
    },
    '9000000008064': {
        'item_id': '9000000008064',
        'item_name': 'MacBook Air 15 M3',
        'description': 'The 15-inch MacBook Air with M3 chip combines a larger immersive display with excellent portability. Ideal for students and professionals needing multitasking and battery efficiency.',
        'rate': 1299.0,
        'mrp': 1402.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Apple',
            'processor_brand': 'Apple',
            'cpu_architecture': 'ARM64',
            'processor': 'M3',
            'core_count': '8',
            'weight': '3.3 lb',
            'dimensions': '13.4 x 9.35 x 0.45 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Apple',
                    'CPU Architecture': 'ARM64',
                    'Processor': 'M3',
                    'Core count': '8',
                },
            },
            'sku': 'MBA15-M3-512',
            'part_number': 'MRYU3LL/A',
        },
        'inventory': {
            'stock_on_hand': 80,
            'available_stock': 80,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 180,
            'units_sold_7d': 42,
        },
        'returns': {
            'quantity_returned_30d': 4,
            'return_rate': 0.022,
        },
        'promotions': None,
    },
    '9000000008112': {
        'item_id': '9000000008112',
        'item_name': 'Dell XPS 13 Plus',
        'description': 'The Dell XPS 13 Plus features Intel Core Ultra processors, a nearly borderless OLED display, premium aluminum construction, and excellent portability for professionals.',
        'rate': 1499.0,
        'mrp': 1618.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Dell',
            'processor_brand': 'Intel',
            'cpu_architecture': 'x86',
            'processor': 'Core Ultra 7',
            'core_count': '16',
            'weight': '2.8 lb',
            'dimensions': '11.63 x 7.84 x 0.6 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Intel',
                    'CPU Architecture': 'x86',
                    'Processor': 'Core Ultra 7',
                    'Core count': '16',
                },
            },
            'sku': 'XPS13PLUS-U7',
            'part_number': 'XPS9340',
        },
        'inventory': {
            'stock_on_hand': 20,
            'available_stock': 20,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 95,
            'units_sold_7d': 22,
        },
        'returns': {
            'quantity_returned_30d': 3,
            'return_rate': 0.028,
        },
        'promotions': None,
    },
    '9000000008130': {
        'item_id': '9000000008130',
        'item_name': 'HP Spectre x360 14',
        'description': 'The HP Spectre x360 14 is a premium 2-in-1 convertible laptop with OLED touchscreen, Intel Core Ultra processors, and strong battery life.',
        'rate': 1599.0,
        'mrp': 1726.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'HP',
            'processor_brand': 'Intel',
            'cpu_architecture': 'x86',
            'processor': 'Core Ultra 7',
            'core_count': '16',
            'weight': '3.2 lb',
            'dimensions': '12.35 x 8.68 x 0.67 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Intel',
                    'CPU Architecture': 'x86',
                    'Processor': 'Core Ultra 7',
                    'Core count': '16',
                },
            },
            'sku': 'SPECTRE14-U7',
            'part_number': '14-eu0097nr',
        },
        'inventory': {
            'stock_on_hand': 50,
            'available_stock': 50,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 110,
            'units_sold_7d': 26,
        },
        'returns': {
            'quantity_returned_30d': 4,
            'return_rate': 0.16,
        },
        'promotions': None,
    },
    '9000000008147': {
        'item_id': '9000000008147',
        'item_name': 'Lenovo ThinkPad X1 Carbon Gen 12',
        'description': 'The ThinkPad X1 Carbon Gen 12 offers enterprise-grade reliability, Intel Core Ultra performance, exceptional keyboard quality, and lightweight carbon fiber construction.',
        'rate': 1749.0,
        'mrp': 1888.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Lenovo',
            'processor_brand': 'Intel',
            'cpu_architecture': 'x86',
            'processor': 'Core Ultra 7',
            'core_count': '16',
            'weight': '2.4 lb',
            'dimensions': '12.31 x 8.45 x 0.59 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Intel',
                    'CPU Architecture': 'x86',
                    'Processor': 'Core Ultra 7',
                    'Core count': '16',
                },
            },
            'sku': 'X1CARBON-G12',
            'part_number': '21KC002CUS',
        },
        'inventory': {
            'stock_on_hand': 25,
            'available_stock': 25,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 88,
            'units_sold_7d': 20,
        },
        'returns': {
            'quantity_returned_30d': 3,
            'return_rate': 0.034,
        },
        'promotions': None,
    },
    '9000000008165': {
        'item_id': '9000000008165',
        'item_name': 'ASUS ROG Zephyrus G14',
        'description': 'The ASUS ROG Zephyrus G14 combines AMD Ryzen AI processors with NVIDIA RTX graphics in a compact gaming and creator-focused laptop.',
        'rate': 1899.0,
        'mrp': 2050.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'ASUS',
            'processor_brand': 'AMD',
            'cpu_architecture': 'x86',
            'processor': 'Ryzen 9 Hx',
            'core_count': '12',
            'weight': '3.3 lb',
            'dimensions': '12.24 x 8.94 x 0.73 in',
            'specifications': {
                'Processor': {
                    'Brand': 'AMD',
                    'CPU Architecture': 'x86',
                    'Processor': 'Ryzen 9 Hx',
                    'Core count': '12',
                },
            },
            'sku': 'ROG-G14-RTX4070',
            'part_number': 'GA403UI',
        },
        'inventory': {
            'stock_on_hand': 30,
            'available_stock': 30,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 140,
            'units_sold_7d': 33,
        },
        'returns': {
            'quantity_returned_30d': 3,
            'return_rate': 0.021,
        },
        'promotions': {
            'coupon_code': 'GAMING15',
            'discount_by': 'percentage',
            'discount_value': 15.0,
        },
    },
    '9000000008079': {
        'item_id': '9000000008079',
        'item_name': 'MacBook Pro 14 M4',
        'description': 'The MacBook Pro 14-inch with Apple M4 chip delivers pro-grade performance for developers, creators, and video editors with advanced thermal efficiency and Liquid Retina XDR display.',
        'rate': 1999.0,
        'mrp': 2158.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Apple',
            'processor_brand': 'Apple',
            'cpu_architecture': 'ARM64',
            'processor': 'M4',
            'core_count': '10',
            'weight': '3.5 lb',
            'dimensions': '12.31 x 8.71 x 0.61 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Apple',
                    'CPU Architecture': 'ARM64',
                    'Processor': 'M4',
                    'Core count': '10',
                },
            },
            'sku': 'MBP14-M4-512',
            'part_number': 'Z1C80001A',
        },
        'inventory': {
            'stock_on_hand': 46,
            'available_stock': 46,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 120,
            'units_sold_7d': 28,
        },
        'returns': {
            'quantity_returned_30d': 10,
            'return_rate': 0.083,
        },
        'promotions': None,
    },
    '9000000008094': {
        'item_id': '9000000008094',
        'item_name': 'MacBook Pro 16 M4 Pro',
        'description': 'The MacBook Pro 16-inch with M4 Pro chip is designed for intensive workloads including software development, AI model testing, music production, and cinematic video editing.',
        'rate': 2799.0,
        'mrp': 3022.92,
        'item_categories': 'Laptop',
        'attributes': {
            'brand': 'Apple',
            'processor_brand': 'Apple',
            'cpu_architecture': 'ARM64',
            'processor': 'M4 Pro',
            'core_count': '12',
            'weight': '4.7 lb',
            'dimensions': '14.01 x 9.77 x 0.66 in',
            'specifications': {
                'Processor': {
                    'Brand': 'Apple',
                    'CPU Architecture': 'ARM64',
                    'Processor': 'M4 Pro',
                    'Core count': '12',
                },
            },
            'sku': 'MBP16-M4PRO-1TB',
            'part_number': 'Z1D10001B',
        },
        'inventory': {
            'stock_on_hand': 87,
            'available_stock': 87,
            'reorder_level': 10,
        },
        'sales': {
            'units_sold_30d': 75,
            'units_sold_7d': 18,
        },
        'returns': {
            'quantity_returned_30d': 1,
            'return_rate': 0.013,
        },
        'promotions': None,
    },
}


class MockMCPClient:
    """Simulates Zoho Commerce MCP calls from an in-memory catalog."""

    def get_product_summary(self, product_ids: list[str]) -> list[dict]:
        """Slim payload used by /canshowComparison triage."""
        out: list[dict] = []
        for pid in product_ids:
            p = _CATALOG.get(pid)
            if not p:
                continue
            out.append({
                "item_id": p["item_id"],
                "item_name": p["item_name"],
                "item_categories": p["item_categories"],
                "rate": p["rate"],
                "units_sold_30d": p["sales"]["units_sold_30d"],
                "available_stock": p["inventory"]["available_stock"],
            })
        return out

    def get_product_full(self, product_id: str) -> dict | None:
        """Full fused public + private record used by /compare."""
        p = _CATALOG.get(product_id)
        return deepcopy(p) if p else None

    def get_catalog(self) -> list[dict]:
        """Slim records for all products — used by the alternative-product finder."""
        return [
            {
                "item_id":         p["item_id"],
                "item_name":       p["item_name"],
                "rate":            p["rate"],
                "item_categories": p["item_categories"],
            }
            for p in _CATALOG.values()
        ]

    def list_all_ids(self) -> list[str]:
        """Convenience for tests."""
        return list(_CATALOG.keys())
