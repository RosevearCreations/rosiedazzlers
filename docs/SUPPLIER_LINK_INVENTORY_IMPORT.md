# Supplier Link Inventory Import — Build 233

The admin catalog accepts Amazon.ca and Amazon.com product links and creates a reviewable inventory draft. The endpoint normalizes the URL, extracts the ASIN and available public metadata, checks exact duplicates, suggests classification, and writes an audit event.

## Safety boundaries

- HTTPS and an allowlisted supplier host are required.
- The preview never saves inventory automatically.
- Administrators must review name, classification, image, price, quantity and notes.
- Amazon page markup can change or block automated reads; partial drafts remain supported.
- Images remain external URLs until separately reviewed and moved through the existing media process.
- No order placement, credential storage or customer-facing publication is enabled.

## Next supplier adapters

Canadian Tire, Home Depot, Princess Auto, Uline, Costco and Walmart should implement the same normalized preview response rather than create separate inventory schemas.
