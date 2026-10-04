# LiveSync Backend

Express + JWT + bcryptjs + Amazon DynamoDB. After every order change it publishes an event to AWS AppSync so every open browser updates instantly.

## 1. Local development (no AWS needed)

```bash
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm start
```

Open http://localhost:5000/api/health — you should see `{"status":"ok","store":"memory",...}`.

With `STORE=memory` data lives in RAM and is lost on restart. This mode is for local development only. Use `STORE=dynamodb` for persistent restaurant, menu, user, and order data.

Demo accounts (created automatically):

| Role | Email | Password |
|---|---|---|
| Admin | admin@livesync.io | admin123 |
| Customer | customer@gmail.com | customer123 |
| Delivery | delivery@express.com | delivery123 |
| Delivery 2 | partner2@express.com | partner123 |

## 2. Switch to DynamoDB

1. Set `STORE=dynamodb` and `AWS_REGION=us-east-1` in `.env`. The AWS SDK uses its standard credential chain (such as an AWS profile or an IAM role); access keys do not need to be put in this file. The AWS identity needs permission to describe, create, read, write, query, and update the tables.
2. Create the tables: `npm run create-tables`
   - `LiveSyncUsers` (key `userId`, index `email-index`)
   - `LiveSyncOrders` (key `orderId`, indexes `customer-index`, `delivery-index`)
   - `LiveSyncActivity` (key `logId`)
   - `LiveSyncRestaurants` (key `restaurantId`)
   - `LiveSyncMenuItems` (key `itemId`, index `restaurant-index` on `restaurantId`)
   - If your existing `LiveSyncUsers` table has a different key, the script tells you. Delete it and re-run, or set `USERS_TABLE=LiveSyncUsersV2`.
3. Add the optional initial Indian restaurant/menu records with `npm run seed-catalog`. This command requires `STORE=dynamodb`; it inserts only missing deterministic IDs and leaves existing records unchanged.
4. Run `npm start`.
5. Check http://localhost:5000/api/health/db — every table should say `ACTIVE`.

From the backend directory, the full setup/run command sequence is:

```bash
npm install
cp .env.example .env
# Configure AWS credentials through the AWS SDK credential chain, and set STORE=dynamodb.
npm run create-tables
npm run seed-catalog
npm start
```

The catalog table names can be changed with `RESTAURANTS_TABLE` and `MENU_ITEMS_TABLE`. The defaults are the table names above. Restaurant and menu writes require an authenticated `ADMIN`; catalog reads are public. Menu `price` values are DynamoDB numbers (for example, `250`), without a currency symbol.

## 3. Turn on real-time (AWS AppSync)

1. AWS Console -> AppSync -> **Create API** -> *Design from scratch* (GraphQL), region us-east-1.
2. **Schema** -> paste `aws/appsync-schema.graphql` -> Save.
3. In the schema page, next to `Mutation.publishOrderEvent` click **Attach** (resolver):
   - Create a data source of type **None** (name it `NoneDS`).
   - Runtime: *VTL*. Request mapping template = `aws/publishOrderEvent.request.vtl`, response mapping template = `aws/publishOrderEvent.response.vtl`.
4. **Settings -> Primary authorization mode = API key**. Copy the **API URL** and **API key**.
5. Put them in this backend's `.env`:
   ```
   APPSYNC_ENDPOINT=https://xxxx.appsync-api.us-east-1.amazonaws.com/graphql
   APPSYNC_API_KEY=da2-xxxxxxxx
   ```
   and the same two values in the frontend's `.env` (`VITE_APPSYNC_ENDPOINT`, `VITE_APPSYNC_API_KEY`).
6. Restart. The startup banner should say `AppSync publish : ON`.

Without AppSync the app still works: the frontend polls every 5 seconds instead.

## API

All routes need `Authorization: Bearer <token>` except `/api/auth/*` and `/api/health*`.

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Create account |
| POST | /api/auth/login | public | Returns `{ token, user }` |
| GET | /api/auth/me | any | Current user |
| GET | /api/orders | any | Orders for the caller (admin: all, customer: own, delivery: assigned) |
| GET | /api/orders/:id | owner/assigned/admin | One order |
| POST | /api/orders | customer | Create order (prices and totals read/calculated server-side) |
| PATCH | /api/orders/:id/status | admin / assigned delivery / customer cancel | `{ "status": "PICKED_UP" }` |
| PATCH | /api/orders/:id/assign | admin | `{ "deliveryPartnerId": "..." }` |
| GET | /api/admin/customers, /delivery-partners, /analytics, /activity | admin | Dashboards |
| PATCH | /api/auth/me/availability | delivery partner | Persist own `availability` (`AVAILABLE`, `BUSY`, or `OFFLINE`) |
| PATCH | /api/admin/delivery-partners/:deliveryPartnerId/availability | admin | Update a partner's availability |
| GET | /api/restaurants | public | Active restaurants |
| GET | /api/restaurants/:restaurantId | public | One restaurant |
| GET | /api/restaurants/nearby?lat={latitude}&lng={longitude}&radius={km} | public | Active restaurants in range, nearest first (radius defaults to 10 km; maximum 50 km) |
| GET | /api/restaurants/:restaurantId/menu | public | Available menu items for an active restaurant |
| POST | /api/restaurants | admin | Create a restaurant |
| PUT | /api/restaurants/:restaurantId | admin | Update a restaurant |
| DELETE | /api/restaurants/:restaurantId | admin | Soft-delete a restaurant |
| GET | /api/menu/:itemId | public | One menu item |
| POST | /api/menu | admin | Create a menu item |
| PUT | /api/menu/:itemId | admin | Update a menu item |
| DELETE | /api/menu/:itemId | admin | Mark a menu item unavailable |

Restaurant create/update JSON fields are `name`, `location`, `address`, numeric `latitude`, numeric `longitude`, `description`, `image`, and (for update) `isActive`. Menu create/update JSON fields are `restaurantId`, `name`, `description`, `category`, numeric `price`, `image`, and (for update) `isAvailable`. IDs and timestamps are generated by the backend.

The nearby endpoint scans active restaurant records, computes Haversine distances using a 6371 km Earth radius, removes restaurants outside the requested radius, and sorts the rest nearest-first. Latitude must be between -90 and 90; longitude between -180 and 180; radius must be positive and at most 50 km.

Order item input must include the catalog `itemId` and `quantity` (legacy `id` is also accepted as the item ID). Client-supplied `price` and `name` are ignored. The API reads the item and restaurant from the catalog tables, rejects unavailable items/inactive restaurants, and stores the catalog price, per-item total, subtotal, delivery fee, and final total. All items in one order must belong to one restaurant. Example:

```json
{
  "restaurantId": "rest-hyderabad",
  "items": [{ "itemId": "item-hyd-biryani", "quantity": 2, "price": 1 }],
  "deliveryAddress": "Banjara Hills, Hyderabad",
  "contactNumber": "9000000000"
}
```

The `price` shown above is ignored; stored DynamoDB menu price is used instead.

`CORS_ORIGIN` continues to control allowed frontend origins. The backend API base URL and existing `/api` prefix do not change. A frontend that currently calls this backend only needs to switch its restaurant/menu data source to these catalog endpoints and send menu item IDs when creating orders; it does not need a different backend URL.

Lifecycle: `PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED` (forward only; `CANCELLED` allowed from non-final states by admin, or by the customer while `PLACED`).

## Tests

`npm test` runs unit tests for order lifecycle/pricing rules and the in-memory store.

## Known limitations (mention these honestly in your review)

- The AppSync API key is visible in the browser, so anyone with it could listen to order events. Production fix: Cognito or a Lambda authorizer.
- Set `ALLOW_ADMIN_REGISTER=false` and a strong `JWT_SECRET` before any real deployment.
