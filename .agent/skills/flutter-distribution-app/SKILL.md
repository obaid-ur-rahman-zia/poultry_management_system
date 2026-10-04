---
name: flutter-distribution-app
description: Complete Flutter app skill for the distribution system. Covers every screen, component, API, architecture, and UX pattern needed to build a production-grade mobile app mirroring the Next.js single-tenant distribution web app (dashboard, inventory, POS variants, purchases, returns, accounting, reports, organizations, logs).
---

# Flutter distribution app — design and architecture skill

This skill is derived from the **single-tenant-distribution-system** Next.js codebase (`app/(interfaces)`, `app/api`, `lib/links.js`, shadcn/ui, next-auth, org screen permissions). A developer should be able to implement the Flutter app **without opening the web repo** by following sections 1–13 and the screen/API catalogs below.

---

## 1. PROJECT OVERVIEW

### App identity

- **Working name:** Distribution / single-tenant ERP (matches web product scope).
- **Purpose:** Manage distribution operations — areas & geography, products & warehouses, quotations, purchases & purchase returns, sales (distribution + multiple POS skins), sale returns, customers/suppliers/employees, chart of accounts & vouchers, analytics dashboard, PDF/CSV reports, activity logs, org branding/theme (web), super-admin org provisioning (web).

### User roles (session)

From `lib/auth.js` / Prisma `user`:

| Role | Notes |
|------|--------|
| `SUPER_ADMIN` | `is_super_admin === 1` OR session override; bypasses screen allowlist; sees **Organizations** nav (`lib/links.js` `superAdminOnly`). |
| `ADMIN` | Full admin features; sees admin-only nav (logs, settings). |
| `USER` | Standard operator; nav filtered by **allowed screens** + `warehouses_enabled`. |

### Secondary gates

- **Middleware** (`config/roles.js`): extra role checks for paths like `/user_management`, `/reports`, `/accounts`, `/sale` (legacy prefixes — Flutter should keep equivalent checks if those paths exist).
- **Org screen permissions** (`GET /api/user/screens`): primary nav and route guard use `allowed_screens` + `path_access` + `path_access_unmatched` (`contexts/AllowedScreensProvider.jsx`, `lib/screenPathUtils.js`).

### Target platforms

- **Android** and **iOS**.
- **Flutter** stable channel **≥ 3.24** (3.x), **Dart ≥ 3.5** (3.x).

### Web stack reference (parity targets)

- **UI:** shadcn/ui + Tailwind v4 + **Lucide** icons + `next-intl`.
- **Shell:** collapsible sidebar (DnD reorder), header (search, theme, profile, org switcher), **mobile bottom nav** (Dashboard, Area, Voucher + “More” sheet).
- **API:** Next route handlers under `/api/...` with JSON envelope (`response_code`, `response_status`, `response_message`, `response_result`).

---

## 2. ARCHITECTURE — MODULAR CLEAN ARCHITECTURE

Use **feature-first** layout. **No cross-feature imports** except through `core/`.

```text
lib/
├── core/
│   ├── constants/           # app_constants.dart, api_constants.dart, asset_paths.dart, route_names.dart
│   ├── theme/               # app_theme.dart, app_colors.dart, app_typography.dart, app_spacing.dart, app_radii.dart
│   ├── network/
│   │   ├── api_client.dart       # Dio + interceptors
│   │   ├── api_queue.dart        # optional FIFO queue, concurrency 3
│   │   ├── api_response.dart     # parse envelope → typed result / failure
│   │   └── interceptors/
│   ├── errors/            # failures.dart, app_exception.dart
│   ├── routing/           # app_router.dart, route_guards.dart, deep_link_config.dart
│   ├── l10n/              # ARB files mirroring next-intl keys where useful
│   ├── utils/             # extensions, formatters, validators
│   └── widgets/           # app_button, app_text_field, app_card, skeleton_*, status_badge, app_dialog, app_bottom_sheet, data_table_*
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── permissions/       # allowed screens cache, path_access matcher (longest-prefix)
│   ├── area/
│   ├── warehouse/
│   ├── product/
│   ├── quotation/
│   ├── purchase/
│   ├── purchase_return/
│   ├── sales_distribution/
│   ├── sales_pos_generic/
│   ├── sales_pos_sufyan_tyre/
│   ├── sales_pos_hassan_traders/
│   ├── sale_return/
│   ├── customer/
│   ├── supplier/
│   ├── employee/
│   ├── account/
│   ├── voucher/
│   ├── reports_account/
│   ├── reports_sale/
│   ├── reports_purchase/
│   ├── reports_stock/
│   ├── logs/
│   ├── settings/
│   ├── profile/
│   ├── organizations/     # super-admin only
│   └── shell/             # scaffold with drawer + bottom nav + app bar search entry
├── injection_container.dart
└── main.dart
```

### Domain rules

- **Repository pattern:** `presentation` → `domain` (abstract repo + use cases) → `data` (repo impl → remote datasource only).
- **JSON:** all DTOs under `features/*/data/models/` with `@JsonSerializable(fieldRename: FieldRename.snake)` (or explicit `@JsonKey(name: '...')` matching API).
- **Envelope:** every successful API returns `response_result` as the payload body; errors use `response_status: error` and HTTP 4xx/5xx.

---

## 3. CONSTANTS (never hardcode in widgets)

### 3.1 `AppConstants`

| Key | Suggested value | Web reference |
|-----|-----------------|---------------|
| `appName` | from org settings / build flavor | session `org_name` |
| `defaultPageSize` | `20` | list pages use `page` & `limit` query params |
| `maxPageSize` | `100` | align with APIs that clamp limit |
| `searchDebounceMs` | `350` | header global search |
| `minSearchQueryLength` | `2` | `/api/search` rejects shorter |
| `dateDisplayFormat` | org locale | `OrganizationLocaleProvider` pattern |
| `currencyCode` | org locale | `formatOrgCurrency` |
| `decimalDigits` | `2` | money lines |
| `animationStaggerMs` | `40` | list stagger |
| `apiQueueMaxConcurrent` | `3` | section 7 |

### 3.2 `ApiConstants`

**Base path:** web uses same-origin `/api`. Flutter should set:

```dart
static const String apiPrefix = '/api'; // prepend to all paths; host from flavor
```

**Known backend gap:** web calls `GET /api/product/read/readLastPrice?customer_id=&product_id=` from Hassan POS page — **no `route.js` exists** in repo. Either implement server route + repository or **omit** feature on mobile until backend exists.

Full path constants (mirror exactly; methods from route handlers — see §7 registry):

```dart
abstract final class ApiConstants {
  static const String analyticsDashboard = '/api/analytics/dashboard';
  static const String analyticsCashBalance = '/api/analytics/read/cashBalance';
  static const String analyticsLowProducts = '/api/analytics/read/lowProducts';
  static const String analyticsPurchasesTrend = '/api/analytics/read/purchasesTrend';
  static const String analyticsRecentActivity = '/api/analytics/read/recentActivity';
  static const String analyticsRevenueTrend = '/api/analytics/read/revenueTrend';
  static const String analyticsSalesVsPurchases = '/api/analytics/read/salesVsPurchases';
  static const String analyticsTodayPurchases = '/api/analytics/read/todayPurchases';
  static const String analyticsTodaySales = '/api/analytics/read/todaySales';
  static const String analyticsTopCustomers = '/api/analytics/read/topCustomers';
  static const String analyticsTopProducts = '/api/analytics/read/topProducts';

  static const String area = '/api/area';
  static const String areaReadAll = '/api/area/readAll';
  static const String areaRead = '/api/area/read';
  static const String areaReadUnassigned = '/api/area/read/readUnassigned';

  static const String subarea = '/api/subarea';
  static const String subareaReadAll = '/api/subarea/readAll';
  static const String subareaRead = '/api/subarea/read';

  static const String mapsLocationAutocomplete = '/api/maps/location/autocomplete';
  static const String mapsLocationPlaceDetails = '/api/maps/location/place-details';
  static const String mapsGoogleAutocomplete = '/api/maps/google/autocomplete';
  static const String mapsGooglePlaceDetails = '/api/maps/google/place-details';

  static const String product = '/api/product';
  static const String productReadAll = '/api/product/readAll';
  static const String productReadById = '/api/product/readById';
  static const String productReadSerialNo = '/api/product/read/readSerialNo';
  static const String productReadProductStock = '/api/product/read/readProductStock';
  static const String productReadProductHistory = '/api/product/read/readProductHistory';
  static const String productReadProductHistorySerial = '/api/product/read/readProductHistorySerial';
  static const String productReadAllSerials = '/api/product/read/readAllSerials';
  static const String productReadWarehouseStock = '/api/product/read/readWarehouseStock';
  // static const String productReadLastPrice = '/api/product/read/readLastPrice'; // MISSING ROUTE — backend gap

  static const String category = '/api/category';
  static const String categoryReadAll = '/api/category/readAll';

  static const String unit = '/api/unit';
  static const String unitReadAll = '/api/unit/readAll';

  static const String company = '/api/company';
  static const String companyReadAll = '/api/company/readAll';

  static const String productGroup = '/api/productGroup';
  static const String productGroupReadAll = '/api/productGroup/readAll';

  static const String warehouse = '/api/warehouse';
  static const String warehouseReadAll = '/api/warehouse/readAll';
  static const String warehouseTransfer = '/api/warehouse/transfer';

  static const String quotation = '/api/quotation';
  static const String quotationReadAll = '/api/quotation/readAll';
  static const String quotationReadById = '/api/quotation/readById';

  static const String purchase = '/api/purchase';
  static const String purchaseReadAll = '/api/purchase/readAll';
  static const String purchaseReadById = '/api/purchase/readById';
  static const String purchaseReadReportDetail = '/api/purchase/read/readReportDetail';
  static const String purchaseReadProductWiseReport = '/api/purchase/read/readProductWiseReport';
  static const String purchaseDownloadReport = '/api/purchase/read/downloadPurchaseReport';
  static const String purchaseDownloadSummary = '/api/purchase/read/downloadPurchaseSummary';

  static const String purchaseReturn = '/api/purchaseReturn';
  static const String purchaseReturnReadAll = '/api/purchaseReturn/readAll';
  static const String purchaseReturnReadById = '/api/purchaseReturn/readById';
  static const String purchaseReturnReadReportDetail = '/api/purchaseReturn/read/readReportDetail';
  static const String purchaseReturnDownloadReport = '/api/purchaseReturn/read/downloadPurchaseReport';

  static const String sale = '/api/sale';
  static const String saleReadAll = '/api/sale/readAll';
  static const String saleReadById = '/api/sale/readById';
  static const String saleReadReportDetail = '/api/sale/read/readReportDetail';
  static const String saleReadProductWiseReport = '/api/sale/read/readProductWiseReport';
  static const String saleReadByProduct = '/api/sale/read/readByProduct';
  static const String saleDownloadReport = '/api/sale/read/downloadSaleReport';
  static const String saleDownloadSummary = '/api/sale/read/downloadSaleSummary';

  static const String saleReturn = '/api/saleReturn';
  static const String saleReturnReadAll = '/api/saleReturn/readAll';
  static const String saleReturnReadById = '/api/saleReturn/readById';
  static const String saleReturnReadReportDetail = '/api/saleReturn/read/readReportDetail';
  static const String saleReturnDownloadReport = '/api/saleReturn/read/downloadSaleReport';

  static const String returnTypeReadAll = '/api/returnType/readAll';

  static const String customer = '/api/customer';
  static const String customerReadAll = '/api/customer/readAll';
  static const String customerReadById = '/api/customer/readById';

  static const String supplier = '/api/supplier';
  static const String supplierReadAll = '/api/supplier/readAll';
  static const String supplierReadById = '/api/supplier/readById';

  static const String employee = '/api/employee';
  static const String employeeReadAll = '/api/employee/readAll';
  static const String employeeReadById = '/api/employee/readById';
  static const String employeeReadArea = '/api/employee/read/readArea';
  static const String employeeReadByArea = '/api/employee/read/readByArea';
  static const String employeeReadRecovery = '/api/employee/read/readRecovery';
  static const String employeeDownloadRecovery = '/api/employee/read/downloadRecovery';
  static const String employeeAssign = '/api/employee/assign';

  static const String employeeDesignation = '/api/employeeDesignation';
  static const String employeeDesignationReadAll = '/api/employeeDesignation/readAll';

  static const String vehicle = '/api/vehicle';
  static const String vehicleReadAll = '/api/vehicle/readAll';
  static const String vehicleReadById = '/api/vehicle/readById';
  static const String vehicleReadUnassigned = '/api/vehicle/read/readUnassigned';

  static const String vehicleType = '/api/vehicleType';
  static const String vehicleTypeReadAll = '/api/vehicleType/readAll';

  static const String accountAccounts = '/api/account/accounts';
  static const String accountAccountsReadAll = '/api/account/accounts/readAll';
  static const String accountAccountsTrialBalance = '/api/account/accounts/read/trialBalance';
  static const String accountAccountsReadLedger = '/api/account/accounts/read/readLedger';
  static const String accountAccountsReadBalance = '/api/account/accounts/read/readBalance';
  static const String accountAccountsDownloadLedger = '/api/account/accounts/read/downloadLedger';

  static const String accountAccountHead = '/api/account/accountHead';
  static const String accountAccountHeadReadAll = '/api/account/accountHead/readAll';

  static const String accountAccountSubHead = '/api/account/accountSubHead';
  static const String accountAccountSubHeadReadAll = '/api/account/accountSubHead/readAll';
  static const String accountAccountSubHeadReadById = '/api/account/accountSubHead/readById';
  static const String accountAccountSubHeadRead = '/api/account/accountSubHead/read';
  static const String accountAccountSubHeadTrialBalance = '/api/account/accountSubHead/read/trialBalance';
  static const String accountAccountSubHeadSubheadDetailTrial = '/api/account/accountSubHead/read/subheadDetailTrial';

  static const String accountAccountManageReadAll = '/api/account/accountManage/readAll';

  static const String transaction = '/api/transaction';
  static const String transactionReadAll = '/api/transaction/readAll';
  static const String transactionReadBalance = '/api/transaction/read/balance';
  static const String transactionReadLast = '/api/transaction/read/readLast';

  static const String voucher = '/api/voucher';
  static const String voucherReadAll = '/api/voucher/readAll';
  static const String voucherReadById = '/api/voucher/readById';
  static const String voucherRead = '/api/voucher/read';
  static const String voucherReadNextId = '/api/voucher/read/nextVoucherId';

  static const String customerGroup = '/api/customerGroup';
  static const String customerGroupReadAll = '/api/customerGroup/readAll';

  static const String search = '/api/search';

  static const String userScreens = '/api/user/screens';
  static const String user = '/api/user';
  static const String userReadAll = '/api/user/readAll';
  static const String userReadById = '/api/user/readById';
  static const String userUpdateStatus = '/api/user/updateStatus';
  static const String userProfile = '/api/user/profile';
  static const String userProfilePassword = '/api/user/profile/password';

  static const String organization = '/api/organization';
  static const String organizationById = '/api/organization/'; // + org_id
  static const String organizationSwitch = '/api/organization/switch';
  static const String organizationTheme = '/api/organization/theme';
  static const String organizationScreens = '/api/organization/screens';
  static const String organizationUsers = '/api/organization/users';
  static const String organizationPaymentStatus = '/api/organization/payment-status';
  static const String organizationHealth = '/api/organization/health';
  static const String organizationProvision = '/api/organization/provision';
  static const String organizationInvoiceTemplate = '/api/organization/invoice-template';
  static const String organizationBackup = '/api/organization/backup';
  static const String organizationBackupDownload = '/api/organization/backup/download';
  static const String organizationDatabase = '/api/organization/database';
  static const String organizationDatabaseValidate = '/api/organization/database/validate';
  static const String organizationDatabaseSafeSync = '/api/organization/database/safe-sync';
  static const String organizationTenantSchemaStatus = '/api/organization/tenant-schema/status';
  static const String organizationTenantSchemaSyncAll = '/api/organization/tenant-schema/sync-all';

  static const String logs = '/api/logs';
  static const String logsCleanup = '/api/logs/cleanup';
  static const String logsExport = '/api/logs/export';
  static const String logsSettings = '/api/logs/settings';
  static const String logsTest = '/api/logs/test';

  static const String backup = '/api/backup';
  static const String configCompanyEmailDomain = '/api/config/companyEmailDomain';

  static const String uploadImage = '/api/upload/image';

  static const String authForgotPassword = '/api/auth/forgot-password';
  static const String authResetPassword = '/api/auth/reset-password';
}
```

### 3.3 `AssetPaths`

| Asset | Path (web public) | Flutter `pubspec.yaml` |
|-------|-------------------|-------------------------|
| App logo reveal | `/gif/logo-reveal.gif` | `assets/gif/logo_reveal.gif` |
| Gilroy font | `/fonts/gilroy.ttf` | `assets/fonts/Gilroy.ttf` |
| Org logo / profile | URLs from API | `cached_network_image` |

### 3.4 `RouteNames`

Use **path-aligned** names (match deep links to web):

- `splash`, `authSignIn`, `authForgotPassword`, `authResetPassword`
- `dashboard` → `/`
- `area`, `warehouse`, `product`, `productNew`, `productSearch`, `productCategory`, `productDetail`
- `quotation`, `quotationNew`, `quotationLocation`, `quotationHeader`, `quotationProductDetails`, `quotationTotals`
- `purchase`, `purchaseNew`, `purchaseHeader`, `purchaseForm`, `purchaseProductDetails`, `purchaseTotals`, `purchaseProductCreate`, `purchaseSupplierCreate`
- `purchaseReturn`, `purchaseReturnNew`, `purchaseReturnHeader`, `purchaseReturnProductDetails`, `purchaseReturnTotals`
- `salesNew`, `salesDistribution`, `salesDistributionLocation`, `salesDistributionHeader`, `salesDistributionProductDetails`, `salesDistributionForm`, `salesDistributionTotals`
- `salesPosGeneric` + subroutes; `salesPosSufyan` + subroutes; `salesPosHassan` + subroutes
- `saleReturn`, `saleReturnNew`, `saleReturnPreviousSales`, `saleReturnHeader`, `saleReturnProductDetails`, `saleReturnTotals`, `saleReturnFormActions`
- `customer`, `customerNew`, `supplier`, `supplierNew`
- `employee`, `employeeAdd`, `employeeAddNew`, `employeeAssignArea`, `employeeVehicle`
- `account`, `accountAdd`, `accountAddSubhead`, `accountHierarchy`
- `voucher`, `userManagement`, `profile`, `settings`
- `logs`, `logsSettings`
- `organizations`, `organizationDetail`, `organizationEdit`, `organizationManageScreens`
- Report hubs: `reportsAccount`, `reportsSale`, `reportsPurchase`, `reportsStock`
- Report leaves: mirror folder names (`accountLedger`, `transactions`, `trialBalance`, … — see §4.2 table)

---

## 4. SCREENS AND PAGE SPECIFICATIONS

### 4.1 Global shell (applies to all authenticated interface routes)

| Element | Web | Flutter |
|---------|-----|---------|
| Sidebar | `LayoutSidebar.jsx` — groups from `navigationItems`, DnD reorder, collapse | `NavigationDrawer` + saved order in `Hive` / prefs |
| Header | `Header.js` — breadcrumbs, search, notifications placeholder, theme, avatar menu | `SliverAppBar` / `AppBar` + `SearchAnchor` + `PopupMenuButton` (Lucide via `lucide_icons_flutter`) |
| Bottom nav | lg:hidden; tabs: allowed items where id ∈ {dashboard, area, voucher} + More | `NavigationBar` + `ModalBottomSheet` for “More” |
| Screen guard | `ScreenGuard` + `useAllowedScreens` | `GoRouter` redirect: load cached permissions; if denied show `AccessDeniedScreen` |
| Payment banners | `PaymentReminder`, `PaymentSidebarWarning` | `Banner` / `MaterialBanner` calling `ApiConstants.organizationPaymentStatus` |
| Loading | GIF logo | `Lottie` or same GIF in `Image.asset` |

**BLoC (global):** `AuthCubit`, `PermissionsCubit` (wraps `/api/user/screens`), `ThemeCubit`, `LocaleCubit`, `OrganizationBrandingCubit` (theme fetch optional).

---

### 4.2 Master route catalog (every interface `page.js`)

For each route: **Path** = browser path. Implement **one** `GoRoute` with optional sub-routes. **Cubit** name pattern: `PascalCase` + `Cubit`. **Permissions:** unless route is always-allowed (§6), require `isNormAllowedByPathAccess`.

| Path | Primary Cubit | Primary APIs / notes |
|------|-----------------|----------------------|
| `/` | `DashboardCubit` | `GET analyticsDashboard?days&months&limit` → `response_result` keys: `sales`, `purchases`, `cashBalance`, `lowStock`, `revenueTrend`, `purchasesTrend`, `salesVsPurchases`, `topProducts`, `topCustomers`, `recentActivity` |
| `/area` | `AreaCubit` | `areaReadAll`, `subareaRead?area_id`, `subareaReadAll`, `mapsLocationAutocomplete`, `mapsLocationPlaceDetails`, POST `area`, POST `subarea`, PUT `area`, PUT `subarea` |
| `/warehouse` | `WarehouseCubit` | `warehouseReadAll`, `productReadAll`, `productReadWarehouseStock`, POST `warehouse`, POST `warehouseTransfer` |
| `/product` | `ProductListCubit` | `productReadAll`, `tenantApiGet` pattern; pagination if web adds |
| `/product/new` | `ProductEditorCubit` | `unitReadAll`, `categoryReadAll`, `companyReadAll`, `productGroupReadAll`, POST/PUT `product` |
| `/product/productSearch` | `ProductSearchCubit` | `productReadAll` + client filter or search API |
| `/product/productCategory` | `ProductCategoryCubit` | `categoryReadAll`, POST/PUT/DELETE category routes |
| `/product/productDetail` | `ProductDetailCubit` | `productReadById` |
| `/quotation` | `QuotationListCubit` | `quotationReadAll?page&limit`, master data reads like web |
| `/quotation/new` | `QuotationWizardCubit` | step router child routes |
| `/quotation/locationSelector` | step | `employeeReadAll`, `companyReadAll`, `customerReadAll`, `employeeReadArea`, `subareaRead`, `areaRead`, `areaReadAll`, `employeeReadByArea` |
| `/quotation/quotationHeader` | step | form state local + POST `quotation` on finalize |
| `/quotation/productDetails` | step | `productReadById`, line items |
| `/quotation/quotationTotals` | step | totals + PUT `quotation` |
| `/purchase` | `PurchaseListCubit` | `purchaseReadAll` |
| `/purchase/new` | `PurchaseWizardCubit` | navigates sub-steps |
| `/purchase/purchaseHeader` | step | POST/PUT `purchase` |
| `/purchase/purchaseForm` | step | |
| `/purchase/productDetails` | step | |
| `/purchase/purchaseTotals` | step | |
| `/purchase/productCreate` | `ProductEditorCubit` (reuse) | same as product new |
| `/purchase/supplierCreate` | `SupplierEditorCubit` | `companyReadAll`, POST `supplier` |
| `/purchase_return` | `PurchaseReturnListCubit` | `purchaseReturnReadAll` |
| `/purchase_return/new` | `PurchaseReturnWizardCubit` | |
| `/purchase_return/returnHeader` | step | POST/PUT `purchaseReturn` |
| `/purchase_return/productDetails` | step | |
| `/purchase_return/returnTotals` | step | |
| `/sales/new` | `SalesEntryRouterCubit` | web entry — push distribution or POS |
| `/sales/distribution/generic` | `SalesDistributionCubit` | same family as POS: `saleReadAll`, master reads |
| `/sales/distribution/generic/locationSelector` | step | area/subarea/employee |
| `/sales/distribution/generic/salesHeader` | step | |
| `/sales/distribution/generic/productDetails` | step | |
| `/sales/distribution/generic/salesForm` | step | POST/PUT `sale` |
| `/sales/distribution/generic/saleTotals` | step | |
| `/sales/pos/generic` | `SalesPosGenericCubit` | **clone** of distribution with `/sales/pos/generic/...` navigation stack |
| `/sales/pos/sufyan-tyre` | `SalesPosSufyanCubit` | **clone** — product/serial rules per web |
| `/sales/pos/hassan-traders` | `SalesPosHassanCubit` | uses `productReadLastPrice` (**missing API**) |
| `/sale_return` | `SaleReturnListCubit` | `saleReturnReadAll` |
| `/sale_return/new` | `SaleReturnWizardCubit` | |
| `/sale_return/previousSales` | step | `saleReadAll`, `saleReadById` |
| `/sale_return/returnHeader` | step | POST/PUT `saleReturn` |
| `/sale_return/productDetails` | step | |
| `/sale_return/returnTotals` | step | |
| `/sale_return/formActions` | step | actions toolbar |
| `/customer` | `CustomerListCubit` | `customerReadAll` |
| `/customer/new` | `CustomerEditorCubit` | POST/PUT `customer` |
| `/supplier` | `SupplierListCubit` | `supplierReadAll`, `companyReadAll` |
| `/supplier/new` | `SupplierEditorCubit` | POST/PUT `supplier` |
| `/employee` | `EmployeeListCubit` | `employeeReadAll` |
| `/employee/addEmployee` | `EmployeeListNavCubit` | |
| `/employee/addEmployee/new` | `EmployeeEditorCubit` | POST/PUT `employee`, `employeeDesignationReadAll` |
| `/employee/assignArea` | `AssignAreaCubit` | `areaReadUnassigned`, `vehicleReadAll`, `employeeReadAll`, `employeeReadArea`, PUT `employeeAssign` |
| `/employee/vehicle` | `VehicleCubit` | `vehicleReadAll`, `employeeReadAll`, `vehicleTypeReadAll`, GET/POST/PUT `vehicle`, `vehicleReadById` |
| `/account` | `AccountHubCubit` | `accountAccountManageReadAll` |
| `/account/addAccount` | `AccountEditorCubit` | POST/PUT `accountAccounts` |
| `/account/addSubhead` | `SubheadEditorCubit` | POST/PUT `accountAccountSubHead` |
| `/account/accountHierarchy` | `AccountHierarchyCubit` | reads heads/subheads |
| `/voucher` | `VoucherCubit` | `voucherReadAll`, `voucherReadById`, `voucherReadNextId`, POST/PUT/DELETE `voucher`, `transaction` create |
| `/user_management` | `UserManagementCubit` | `userReadAll`, POST/PUT `user`, `userUpdateStatus` |
| `/user_management/[user_id]/manage-screens` | per-user screens | `GET/PUT /api/user/{id}/screens?include_all=true` (SUPER_ADMIN only) |
| `/profile` | `ProfileCubit` | `userProfile`, PUT password |
| `/settings` | `SettingsCubit` | org settings APIs + theme |
| `/logs` | `LogsCubit` | `GET logs` with query params `search,startDate,endDate,logLevel,category,action,page,limit` |
| `/logs/settings` | `LogsSettingsCubit` | `logsSettings`, `logsCleanup` |
| `/organizations` | `OrganizationsCubit` | `organization` GET, tenant schema, provision, health, screens, backup, etc. |
| `/organizations/[org_id]` | `OrganizationDetailCubit` | `organizationById` |
| `/organizations/[org_id]/edit` | `OrganizationEditCubit` | PUT `organization` |
| `/organizations/[org_id]/manage-screens` | legacy | redirects to `/user_management`; org `PUT/POST organization/screens` returns 403 — use per-user screen APIs |
| `/reports/accountReports` | hub | links to children |
| `/reports/accountReports/accountLedger` | `AccountLedgerReportCubit` | `accountAccountsReadAll`, `accountAccountsReadLedger`, download |
| `/reports/accountReports/transactions` | `TransactionsReportCubit` | `transactionReadAll?query` |
| `/reports/accountReports/trialBalance` | `TrialBalanceCubit` | `accountAccountsTrialBalance` |
| `/reports/accountReports/trialBalanceSubhead` | `TrialBalanceSubheadCubit` | `accountAccountSubHeadTrialBalance` |
| `/reports/accountReports/subheadDetailTrial` | `SubheadDetailTrialCubit` | `accountAccountSubHeadSubheadDetailTrial` |
| `/reports/accountReports/recoverySheet` | `RecoverySheetCubit` | `employeeReadRecovery`, `employeeDownloadRecovery` |
| `/reports/saleReports` | hub | |
| `/reports/saleReports/saleDetail` | `SaleDetailReportCubit` | `saleReadReportDetail` |
| `/reports/saleReports/saleDetailCustomer` | filter variant | + customer filter param if web sends |
| `/reports/saleReports/saleDetailProduct` | `productReadAll` + `saleReadProductWiseReport` | |
| `/reports/saleReports/saleSummary` | `SaleSummaryReportCubit` | `transactionReadBalance`, `saleReadReportDetail`, `saleDownloadSummary` |
| `/reports/saleReports/saleReturnDetail` | `SaleReturnDetailReportCubit` | `saleReturnReadReportDetail`, `saleReturnDownloadReport` |
| `/reports/saleReports/saleReturnCustomer` | filter variant | |
| `/reports/purchaseReports` | hub | |
| `/reports/purchaseReports/purchaseDetail` | `PurchaseDetailReportCubit` | `purchaseReadReportDetail`, `purchaseDownloadReport` |
| `/reports/purchaseReports/purchaseDetailSupplier` | supplier filter | |
| `/reports/purchaseReports/purchaseDetailProduct` | `productReadAll`, `purchaseReadProductWiseReport` | |
| `/reports/purchaseReports/purchaseSummary` | `PurchaseSummaryReportCubit` | `purchaseDownloadSummary` |
| `/reports/purchaseReports/purchaseReturnDetail` | `PurchaseReturnDetailReportCubit` | `purchaseReturnReadReportDetail`, `purchaseReturnDownloadReport` |
| `/reports/purchaseReports/purchaseReturnSupplier` | filters | supplier/product matrix |
| `/reports/stockReports` | hub | |
| `/reports/stockReports/productStock` | `ProductStockReportCubit` | `productReadProductStock` |
| `/reports/stockReports/productStockCompany` | company variant | |
| `/reports/stockReports/productHistory` | `ProductHistoryCubit` | `productReadProductHistory` |
| `/reports/stockReports/productHistorySerial` | serial variant | `productReadProductHistorySerial` |
| `/auth/signin` | `SignInCubit` | NextAuth session — **see §6 auth** |
| `/auth/forgot-password` | `ForgotPasswordCubit` | POST `authForgotPassword` `{ email }` |
| `/auth/reset-password` | `ResetPasswordCubit` | POST `authResetPassword` |
| `/*` unknown | `NotFoundScreen` | match web `[...slug]` |

#### Standard per-screen template (apply to every row above)

- **Loading:** skeleton matching layout (cards, table rows, form columns).
- **Empty:** illustration + short copy + primary action (e.g. “Create quotation”).
- **Error:** `Retry` + snackbar with `response_message`.
- **Success side effects:** `BlocListener` for navigation + `HapticFeedback.lightImpact`.
- **Pull-to-refresh:** on every list screen (`RefreshIndicator`).
- **Pagination:** pass `page`, `limit` query where web uses them (`quotationReadAll`, `saleReadAll`, `logs`, etc.).

#### POS / quotation / purchase wizard shared UI

- **Stepper** (`Stepper` or custom `PageView` with `goBranch` in GoRouter).
- **Line items table:** `DataTable` / `PaginatedDataTable` with row actions (edit qty, delete).
- **Async lookups:** salesman → area → subarea cascade exactly like web `useEffect` chains.
- **Maps:** use Flutter `google_maps_flutter` or `mapbox` **or** call existing backend autocomplete (`mapsLocationAutocomplete`) and show picker list (simpler parity).

---

## 5. DESIGN SYSTEM

### 5.1 Colors (`AppColors`)

Map CSS variables from `app/globals.css` `:root` and `.dark` (oklch). Options in Flutter:

1. **Approximate sRGB** hex pairs copied once into `AppColors` light/dark static fields (no oklch in Dart core).
2. **Use `Color.from` with OKLCH** via third-party `oklch` package to parse same strings.

At minimum define: `background`, `foreground`, `card`, `cardForeground`, `popover`, `primary`, `primaryForeground`, `secondary`, `muted`, `mutedForeground`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar`, `sidebarForeground`, `sidebarPrimary`, `sidebarAccent`, `chart1`…`chart5`, `success`, `warning`, `info` (derive success/info from chart greens/blues if not in CSS).

### 5.2 Typography (`AppTypography`)

- **Primary font:** **Gilroy** (bundle TTF; web uses `/fonts/gilroy.ttf`).
- **RTL / Arabic:** **Noto Sans Arabic** as `locale` fallback when `Directionality.of(context) == TextDirection.rtl`.
- **TextTheme mapping:** `displayLarge`, `titleLarge`, `titleMedium`, `bodyLarge`, `bodyMedium`, `labelSmall` with weights/sizes matching Tailwind usage (`text-sm font-medium`, etc.).

### 5.3 Spacing (`AppSpacing`)

`xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`.

### 5.4 Radii (`AppRadii`)

Base `radiusLg = 10` (0.625rem); `sm = base-4`, `md = base-2`, `xl = base+4` per CSS.

### 5.5 Icons

- Package: **`lucide_icons_flutter`** only.
- Sizes: `sm=16`, `md=20`, `lg=24`, `xl=32`.
- **Never** use `Icons.*` from Material for product UI (only where platform forces, e.g. system back).

### 5.6 Core widgets (mirror shadcn behavior)

**`AppButton`:** variants `primary`, `secondary`, `outline`, `ghost`, `destructive`; sizes `sm|md|lg`; states normal / loading (`SizedBox`+`CircularProgressIndicator` inline) / disabled.

**`AppTextField`:** label, hint, prefix/suffix Lucide icon; error text; variants `default`, `search`, `password`.

**`AppCard`:** white/dark surface, border `AppColors.border`, radius `AppRadii.lg`, shadow subtle.

**`Skeleton*`:** `shimmer` package; variants `SkeletonText`, `SkeletonCard`, `SkeletonListTile`, `SkeletonTableRow`, `SkeletonAvatar`.

**`StatusBadge`:** map business statuses (active/inactive, paid/unpaid, voucher types) to `AppColors` chips.

**`AppDataTable`:** sortable columns where web sorts; horizontal scroll on mobile; sticky header.

**`AppBottomSheet` / `AppDialog`:** confirm pattern (title, body, cancel, destructive confirm).

---

## 6. NAVIGATION

### 6.1 `GoRouter`

- **Routes:** mirror §4.2 paths 1:1 for deep linking.
- **Auth redirect:** if no session → `/auth/signin` with `redirect` query.
- **Permission redirect:** after `PermissionsCubit` loads, if `!isRouteAllowed(location)` → `AccessDenied` route (or `/` if product prefers).

### 6.2 Always-allowed routes (`AllowedScreensProvider`)

These bypass `path_access` longest-prefix check (still require authentication unless noted):

- `/auth/signin`
- `/unauthorized` (add if used)
- `/profile`
- `/settings`

**Note:** `/settings` is always allowed by provider; **admin-only visibility** still from nav filter (`adminOnly` in `navigationItems`). Flutter: hide entries for non-admin, but do not block route if user deep-links (match web: provider allows route).

### 6.3 Bottom navigation parity (`BottomNavigation.jsx`)

- **Visible pinned tabs:** from `allowedNavItems` where `type==='single'` AND `id` ∈ {`dashboard`, `area`, `voucher`} **only if** those hrefs remain in allowed set after filtering.
- **More sheet:** all groups + other single items.
- **Active indicator:** top bar on active tab (see web `absolute top-0 ... h-0.5 bg-primary`).

### 6.4 `lib/links.js` alignment

Primary `href`s must exist as `GoRoute` paths: `/`, `/area`, `/product`, `/warehouse`, `/quotation`, `/purchase`, `/purchase_return`, `/sales/distribution/generic`, `/sales/pos/generic`, `/sales/pos/sufyan-tyre`, `/sales/pos/hassan-traders`, `/sale_return`, `/customer`, `/employee`, `/supplier`, `/account`, `/reports/accountReports`, `/reports/saleReports`, `/reports/purchaseReports`, `/reports/stockReports`, `/voucher`, `/user_management`, `/logs`, `/logs/settings`, `/settings`, `/organizations`.

**Warehouse link:** hidden when session `warehouses_enabled == false` (same as web `AllowedScreensProvider`).

---

## 7. API LAYER — CLIENT, QUEUE, ENVELOPE

### 7.1 Envelope parsing

```dart
class ApiEnvelope<T> {
  final int responseCode;
  final String responseStatus; // success | error
  final String? responseMessage;
  final T? responseResult;
}
```

- On HTTP 401 or `Unauthorized` message → emit `AuthFailure` → clear storage → route to sign-in.
- On `response_status == error` → map to `ServerFailure` with message.

### 7.2 `ApiClient` (Dio)

- **Singleton** via `GetIt`.
- **Interceptors:** `AuthInterceptor` (attach session — see §6 auth), `LoggingInterceptor` (debug), `ErrorInterceptor`, `RetryInterceptor` (max 3, idempotent GET only).

### 7.3 `ApiQueue` (optional but spec’d)

- FIFO, max 3 concurrent; attach `CancelToken` per screen `dispose`.

### 7.4 Query parameters (common)

| API family | Params |
|------------|--------|
| `analyticsDashboard` | `days`, `months`, `limit` |
| `quotationReadAll`, `saleReadAll`, … | `page`, `limit` |
| Reports | `start_dat`, `end_dat` (web spelling **dat** not date) |
| `transactionReadAll` | built query string from web `transactions/page.js` |
| `search` | `q`, `limit` (max 3 per entity in web) |
| `employeeReadArea` | `acc_id` |
| `subareaRead` | `area_id` |
| `areaRead` | `subarea_id` |
| `productReadById` | `product_id` |
| `saleReadById` | `sale_id` |
| `quotationReadById` | `quotation_id` |
| `transactionReadBalance` | `acc_id` |

### 7.5 `GET /api/search` result shape (`response_result`)

Array of items:

```json
{
  "id": "product-123",
  "title": "...",
  "subtitle": "Rs. ...",
  "category": "products | customers | suppliers | ...",
  "path": "/product?edit=123"
}
```

Flutter: map `path` to internal `pushNamed` parsing query.

### 7.6 `GET /api/user/screens` (`response_result`)

```json
{
  "allowed_screens": ["/product", "..."],
  "allowed_screen_details": [{ "path": "...", "title": "...", ... }],
  "path_access": [{ "path": "/reports", "enabled": true }],
  "path_access_unmatched": "allow" | "deny",
  "org_id": 1,
  "org_name": "...",
  "is_super_admin": false
}
```

Implement `isNormAllowedByPathAccess` exactly as JS (`lib/screenPathUtils.js`).

---

## 8. STATE MANAGEMENT

- **`flutter_bloc`:** one `Cubit` (or `Bloc`) per screen or wizard flow.
- **Providers:** `MultiBlocProvider` at app root for `AuthCubit`, `PermissionsCubit`, `ThemeCubit`.
- **Feature scope:** provide feature cubits at `ShellRoute` branch level.
- **Side effects:** `BlocListener` for navigation, snackbars, haptics.

### 8.1 Standard state classes

Prefer **sealed** states or `freezed`:

- `Initial`, `Loading`, `Loaded(data)`, `Empty`, `Error(message, stack?)`.

---

## 9. DEPENDENCY INJECTION (`GetIt`)

| Registration | Scope |
|--------------|-------|
| `Dio` / `ApiClient` | lazy singleton |
| `ApiQueue` | lazy singleton |
| `AuthRepository`, `PermissionsRepository` | lazy singleton |
| Each `*Repository` | lazy singleton |
| `GoRouter` | singleton |
| Screen `Cubit`s | factory per route |

---

## 10. LOCAL STORAGE

| Store | Contents |
|-------|----------|
| `flutter_secure_storage` | session cookie OR refresh token OR JWT — see auth |
| `shared_preferences` | theme mode, locale, sidebar order, last org id |
| `Hive` | cached `user/screens` payload, non-sensitive lists (products last fetch) |

---

## 11. PREMIUM UX PATTERNS

- **Skeleton:** every screen §4 template.
- **Motion:** `flutter_animate` — list stagger, `FadeTransition` on route enter.
- **Haptics:** light tap, medium confirm, heavy destructive.
- **Toasts:** `fluttertoast` or `messenger` — success green / error red / info blue / warning amber.
- **Offline:** `connectivity_plus` banner; queue or block mutations.

---

## 12. PACKAGES LIST

**Core:** `flutter_bloc`, `equatable`, `get_it`, `dio`, `json_annotation` + `json_serializable` + `build_runner`, `go_router`, `freezed` + `freezed_annotation` (optional), `dartz` (optional `Either`).

**UI:** `lucide_icons_flutter`, `shimmer`, `flutter_animate`, `google_fonts` (fallback if Gilroy missing).

**Storage:** `shared_preferences`, `flutter_secure_storage`, `hive_flutter`.

**Utils:** `connectivity_plus`, `intl`, `cached_network_image`, `url_launcher` (for downloads).

**Auth (pick one strategy):** `cookie_jar` + `dio_cookie_manager` **if** using session cookies with Dio.

---

## 13. IMPLEMENTATION RULES

1. Never hardcode strings (use `l10n`), colors, spacing, radii, or API paths in widgets — only `App*` / `ApiConstants` / `RouteNames`.
2. All models: `json_serializable`; **no** manual `fromJson` maps in UI.
3. Every screen: skeleton → data or empty/error.
4. Lucide only for product icons.
5. Repository pattern: UI never calls `Dio` directly.
6. Single `baseUrl` / `apiPrefix` in config.
7. Parse **envelope** in one place.
8. Respect org screen permissions + middleware role matrix.
9. Match web query param names exactly (`start_dat`, `product_id`, …) unless backend adds aliases.
10. **Rule 14:** When response shape ambiguous, open matching `app/repositories/**` and Prisma `select` in web to define DTO fields.

---

## 14. MOBILE AUTH AND SESSION PARITY (required reading)

The production web APIs use `withTenantContext` → `getServerSession(next-auth)` — **cookie-based** sessions for browser.

**Option A — Cookie session (closest parity):**

- Dio + `CookieJar` persisted in secure storage.
- Implement sign-in by **posting credentials to NextAuth CSRF + credentials** flow is fragile in native apps; prefer **dedicated REST login** if available.

**Option B — Recommended for Flutter:** add backend **`POST /api/auth/mobile-login`** (or similar) returning short-lived **Bearer JWT** + refresh token; server validates JWT in `withTenantContext` alongside session. Until that exists, use **embedded WebView** sign-in to establish cookies then copy cookies to Dio — only if product accepts WebView UX.

**Super-admin org switch:** web uses `OrganizationSwitcher` + `POST /api/organization/switch` and `update()` session. Flutter must call same API then refetch `user/screens` and clear feature caches.

---

## 15. VERIFICATION CHECKLIST BEFORE RELEASE

- [ ] All `RouteNames` reachable via drawer / bottom nav / search results.
- [ ] `PermissionsCubit` matches longest-prefix algorithm.
- [ ] Dashboard charts data matches web `analyticsDashboard` payload.
- [ ] Report exports download and open (`saleDownloadReport`, etc.).
- [ ] Warehouse gating respects `warehouses_enabled`.
- [ ] Admin-only routes hidden for `USER`.
- [ ] `readLastPrice` either implemented server-side or Hassan POS hides price shortcut.

---

## APPENDIX A — COMPLETE API HTTP METHOD REGISTRY

Methods are from `app/api/**/route.js` (`export const GET|POST|PUT|DELETE` or `export async function`). All tenant-scoped routes use session unless `x-service-secret` matches `SERVICE_SECRET` (`lib/tenantApiWrapper.js`).

| Path | Method(s) |
|------|-----------|
| `/api/analytics/dashboard` | GET |
| `/api/analytics/read/cashBalance` | GET |
| `/api/analytics/read/lowProducts` | GET |
| `/api/analytics/read/purchasesTrend` | GET |
| `/api/analytics/read/recentActivity` | GET |
| `/api/analytics/read/revenueTrend` | GET |
| `/api/analytics/read/salesVsPurchases` | GET |
| `/api/analytics/read/todayPurchases` | GET |
| `/api/analytics/read/todaySales` | GET |
| `/api/analytics/read/topCustomers` | GET |
| `/api/analytics/read/topProducts` | GET |
| `/api/area` | POST, PUT |
| `/api/area/readAll` | GET |
| `/api/area/read` | GET |
| `/api/area/read/readUnassigned` | GET |
| `/api/subarea` | POST, PUT |
| `/api/subarea/readAll` | GET |
| `/api/subarea/read` | GET |
| `/api/maps/location/autocomplete` | GET |
| `/api/maps/location/place-details` | GET |
| `/api/maps/google/autocomplete` | GET |
| `/api/maps/google/place-details` | GET |
| `/api/product` | POST, PUT |
| `/api/product/readAll` | GET |
| `/api/product/readById` | GET |
| `/api/product/read/readSerialNo` | GET |
| `/api/product/read/readProductStock` | GET |
| `/api/product/read/readProductHistory` | GET |
| `/api/product/read/readProductHistorySerial` | GET |
| `/api/product/read/readAllSerials` | GET |
| `/api/product/read/readWarehouseStock` | GET |
| `/api/product/read/readLastPrice` | **MISSING** — not implemented |
| `/api/category` | POST, PUT |
| `/api/category/readAll` | GET |
| `/api/unit` | POST, PUT |
| `/api/unit/readAll` | GET |
| `/api/company` | POST, PUT |
| `/api/company/readAll` | GET |
| `/api/productGroup` | POST, PUT |
| `/api/productGroup/readAll` | GET |
| `/api/warehouse` | POST, PUT |
| `/api/warehouse/readAll` | GET |
| `/api/warehouse/transfer` | POST |
| `/api/quotation` | POST, PUT |
| `/api/quotation/readAll` | GET |
| `/api/quotation/readById` | GET |
| `/api/purchase` | POST, PUT |
| `/api/purchase/readAll` | GET |
| `/api/purchase/readById` | GET |
| `/api/purchase/read/readReportDetail` | GET |
| `/api/purchase/read/readProductWiseReport` | GET |
| `/api/purchase/read/downloadPurchaseReport` | GET |
| `/api/purchase/read/downloadPurchaseSummary` | GET |
| `/api/purchaseReturn` | POST, PUT |
| `/api/purchaseReturn/readAll` | GET |
| `/api/purchaseReturn/readById` | GET |
| `/api/purchaseReturn/read/readReportDetail` | GET |
| `/api/purchaseReturn/read/downloadPurchaseReport` | GET |
| `/api/sale` | POST, PUT |
| `/api/sale/readAll` | GET |
| `/api/sale/readById` | GET |
| `/api/sale/read/readReportDetail` | GET |
| `/api/sale/read/readProductWiseReport` | GET |
| `/api/sale/read/readByProduct` | GET |
| `/api/sale/read/downloadSaleReport` | GET |
| `/api/sale/read/downloadSaleSummary` | GET |
| `/api/saleReturn` | POST, PUT |
| `/api/saleReturn/readAll` | GET |
| `/api/saleReturn/readById` | GET |
| `/api/saleReturn/read/readReportDetail` | GET |
| `/api/saleReturn/read/downloadSaleReport` | GET |
| `/api/returnType/readAll` | GET |
| `/api/customer` | POST, PUT |
| `/api/customer/readAll` | GET |
| `/api/customer/readById` | GET |
| `/api/supplier` | POST, PUT |
| `/api/supplier/readAll` | GET |
| `/api/supplier/readById` | GET |
| `/api/employee` | POST, PUT |
| `/api/employee/readAll` | GET |
| `/api/employee/readById` | GET |
| `/api/employee/read/readArea` | GET |
| `/api/employee/read/readByArea` | GET |
| `/api/employee/read/readRecovery` | GET |
| `/api/employee/read/downloadRecovery` | GET |
| `/api/employee/assign` | PUT |
| `/api/employeeDesignation` | POST, PUT |
| `/api/employeeDesignation/readAll` | GET |
| `/api/vehicle` | POST, PUT |
| `/api/vehicle/readAll` | GET |
| `/api/vehicle/readById` | GET |
| `/api/vehicle/read/readUnassigned` | GET |
| `/api/vehicleType` | POST, PUT |
| `/api/vehicleType/readAll` | GET |
| `/api/account/accounts` | POST, PUT, DELETE |
| `/api/account/accounts/readAll` | GET |
| `/api/account/accounts/read/trialBalance` | GET |
| `/api/account/accounts/read/readLedger` | GET |
| `/api/account/accounts/read/readBalance` | GET |
| `/api/account/accounts/read/downloadLedger` | GET |
| `/api/account/accountHead` | POST, PUT |
| `/api/account/accountHead/readAll` | GET |
| `/api/account/accountSubHead` | POST, PUT |
| `/api/account/accountSubHead/readAll` | GET |
| `/api/account/accountSubHead/readById` | GET |
| `/api/account/accountSubHead/read` | GET |
| `/api/account/accountSubHead/read/trialBalance` | GET |
| `/api/account/accountSubHead/read/subheadDetailTrial` | GET |
| `/api/account/accountManage/readAll` | GET |
| `/api/transaction` | POST |
| `/api/transaction/readAll` | GET |
| `/api/transaction/read/balance` | GET |
| `/api/transaction/read/readLast` | GET |
| `/api/voucher` | POST, PUT, DELETE |
| `/api/voucher/readAll` | GET |
| `/api/voucher/readById` | GET |
| `/api/voucher/read` | GET |
| `/api/voucher/read/nextVoucherId` | GET |
| `/api/customerGroup` | POST, PUT |
| `/api/customerGroup/readAll` | GET |
| `/api/search` | GET |
| `/api/user/screens` | GET |
| `/api/user` | POST, PUT |
| `/api/user/readAll` | GET |
| `/api/user/readById` | GET |
| `/api/user/updateStatus` | PUT |
| `/api/user/profile` | GET, PUT |
| `/api/user/profile/password` | PUT |
| `/api/organization` | GET, PUT, POST (POST returns 400 single-tenant) |
| `/api/organization/[org_id]` | GET |
| `/api/organization/switch` | POST |
| `/api/organization/theme` | GET, POST |
| `/api/organization/screens` | GET, PUT, POST |
| `/api/organization/users` | GET |
| `/api/organization/payment-status` | GET |
| `/api/organization/health` | GET |
| `/api/organization/provision` | POST |
| `/api/organization/invoice-template` | GET, PUT |
| `/api/organization/backup` | POST |
| `/api/organization/backup/download` | GET |
| `/api/organization/database` | POST |
| `/api/organization/database/validate` | POST |
| `/api/organization/database/safe-sync` | POST |
| `/api/organization/tenant-schema/status` | GET |
| `/api/organization/tenant-schema/sync-all` | POST |
| `/api/logs` | GET (admin) |
| `/api/logs/cleanup` | POST |
| `/api/logs/export` | GET |
| `/api/logs/settings` | GET, PUT |
| `/api/logs/test` | POST |
| `/api/backup` | POST |
| `/api/config/companyEmailDomain` | GET |
| `/api/upload/image` | POST JSON `{ imageData, folder }` |
| `/api/auth/forgot-password` | POST |
| `/api/auth/reset-password` | POST |
| `/api/auth/[...nextauth]` | NextAuth handlers |

**DTO derivation:** For each POST/PUT, open the matching `app/controllers/*` or inline handler in `route.js` and mirror Prisma `data:` / `select:` fields in `@JsonSerializable` models.

---

## APPENDIX B — SCREEN-BY-SCREEN EXPANDED SPECS (ALL INTERFACE ROUTES)

Each entry: **Route**, **Roles**, **UI**, **Interactions**, **APIs**, **Loading/Empty/Error**, **Skeleton**, **Navigation**.

### Auth

**`/auth/signin`** — **Cubit:** `SignInCubit`. **Roles:** public. **UI:** email/password fields, submit, link to forgot password. **Interactions:** validate email format, min password length. **APIs:** NextAuth `signIn('credentials')` equivalent — **native:** use agreed token endpoint or WebView. **Loading:** disable form + inline spinner. **Empty:** n/a. **Error:** show credential error from server. **Skeleton:** shimmer form. **Navigation:** on success → `/`.

**`/auth/forgot-password`** — **Cubit:** `ForgotPasswordCubit`. **APIs:** `POST /api/auth/forgot-password` body `{ email }`; success message is generic. **Navigation:** back to signin.

**`/auth/reset-password`** — **Cubit:** `ResetPasswordCubit`. **APIs:** `POST /api/auth/reset-password` with token + new password (match web body). **Navigation:** sign in on success.

### Core

**`/` Dashboard** — **UI:** KPI cards (today sales/purchases counts & amounts), cash balance card, low stock alert list, combo charts (bar/line), top products/customers lists, recent activity list, time range selector (7/30/90 days), refresh icon. **Interactions:** change range → refetch; tap row → navigate `path` from activity if present. **APIs:** `GET analyticsDashboard?days&months&limit`. **Loaded:** chart config colors from `AppColors.chart*`. **Empty:** charts empty state “No data in range”. **Skeleton:** 4 metric cards + 2 chart placeholders + 3 list blocks. **Error:** retry + message. **Navigation:** sidebar “Dashboard”.

**`/area`** — **UI:** master–detail: area list, subarea list/table, map picker fields for geo. **Interactions:** select area → load subareas; create/edit area & subarea dialogs; address autocomplete. **APIs:** `areaReadAll`, `subareaRead?area_id`, `subareaReadAll`, `mapsLocationAutocomplete`, `mapsLocationPlaceDetails`, POST/PUT `area`, POST/PUT `subarea`. **Skeleton:** two-column list skeleton + map placeholder. **Empty:** “No areas” + CTA create. **Error:** map API failure → fallback manual fields.

**`/warehouse`** — **UI:** warehouse list, create/edit dialog, stock transfer section (from/to warehouse, product select, qty). **APIs:** `warehouseReadAll`, `productReadAll`, `productReadWarehouseStock`, POST `warehouse`, POST `warehouseTransfer`. **Skeleton:** card list + transfer form skeleton.

**`/product`** — **UI:** data table (code, title, price, stock indicators), filters, FAB new, row tap edit. **APIs:** `productReadAll`, `unitReadAll`, `categoryReadAll`, `companyReadAll`, `productGroupReadAll` for editors; `productReadById` on edit. **POST/PUT** `product`. **Empty:** illustration + “Add product”. **Skeleton:** table row skeletons.

**`/product/new`**, **`/product/productDetail`**, **`/product/productSearch`**, **`/product/productCategory`** — reuse **ProductEditorCubit** / **ProductSearchCubit** / **ProductCategoryCubit** as in §4.2; **category** screens additionally call `categoryReadAll` + POST/PUT `category`.

### Quotations

**`/quotation`** — list with pagination, filters, new quotation CTA. **APIs:** `quotationReadAll?page&limit`; prefetch employees, companies, customers. **Skeleton:** table. **Navigation:** → `/quotation/new`.

**`/quotation/new`** — hosts stepper child routes: **locationSelector** (cascade dropdowns), **quotationHeader** (dates, refs, customer), **productDetails** (lines), **quotationTotals** (discounts/taxes/totals). **APIs:** cascade per web `quotation/page.js`; `quotationReadById` when editing; POST/PUT `quotation`. **Skeleton:** stepper header + content placeholder per step. **Empty states:** “Select salesman first” inline hints.

### Purchases

**`/purchase`**, **`/purchase/new`**, **`/purchase/purchaseHeader`**, **`/purchase/purchaseForm`**, **`/purchase/productDetails`**, **`/purchase/purchaseTotals`**, **`/purchase/productCreate`**, **`/purchase/supplierCreate`** — **Cubit:** `PurchaseWizardCubit` with `GoRouter` stateful shell route. **APIs:** `purchaseReadAll`, `purchaseReadById`, POST/PUT `purchase`, `supplierReadAll`, `companyReadAll`, product endpoints for lines. **Interactions:** unsaved warning on pop (match `useUnsavedWarning`). **Skeleton:** form sections per step.

### Purchase returns

**`/purchase_return`** + wizard routes — mirror purchase with **PurchaseReturn** APIs (`purchaseReturn*`).

### Sales distribution & POS variants

**`/sales/distribution/generic/**`** — **Cubit:** `SalesDistributionCubit`. **APIs:** `saleReadAll`, `saleReadById`, POST/PUT `sale`, same geography and product reads as quotation. **UI:** identical stepper pattern to quotation (location → header → lines → totals).

**`/sales/pos/generic/**`**, **`/sales/pos/sufyan-tyre/**`**, **`/sales/pos/hassan-traders/**`** — separate cubits **only** where UI diverges (serial entry, customer create subpages, **Hassan** last-price). **Shared:** `customer` POST for quick customer create routes. **Customer create subroutes:** `/sales/pos/*/customerCreate` — form POST `customer`. **Note:** Hassan **last price** API gap — show disabled tooltip or hide action.

**`/sales/new`** — router hub: choose distribution vs POS flavor (cards or list).

### Sale return

**`/sale_return`** + **`/new`**, **`/previousSales`**, **`/returnHeader`**, **`/productDetails`**, **`/returnTotals`**, **`/formActions`** — **Cubit:** `SaleReturnWizardCubit`. **APIs:** `saleReturnReadAll`, `saleReturnReadById`, `saleReadAll`, `saleReadById`, `returnTypeReadAll`, POST/PUT `saleReturn`. **UI:** pick originating sale, line selection, reasons, totals, action bar. **Skeleton:** wizard layout.

### CRM

**`/customer`**, **`/customer/new`** — table + editor; **APIs:** `customerReadAll`, POST/PUT `customer`, `customerReadById`.

**`/supplier`**, **`/supplier/new`** — same pattern with `supplier*`, `companyReadAll`.

### HR

**`/employee`**, **`/employee/addEmployee`**, **`/employee/addEmployee/new`** — list + navigation to add; **APIs:** `employeeReadAll`, `employeeDesignationReadAll`, POST/PUT `employee`, `employeeReadById`.

**`/employee/assignArea`** — assign areas/vehicles to salesman; **APIs:** `areaReadUnassigned`, `vehicleReadAll`, `employeeReadAll`, `employeeReadArea`, PUT `employeeAssign`. **UI:** multi-select lists + save.

**`/employee/vehicle`** — fleet CRUD; **APIs:** `vehicleReadAll`, `vehicleTypeReadAll`, `employeeReadAll`, GET/POST/PUT `vehicle`, `vehicleReadById`.

### Accounting

**`/account`**, **`/account/addAccount`**, **`/account/addSubhead`**, **`/account/accountHierarchy`** — **APIs:** `accountAccountManageReadAll`, POST/PUT `accountAccounts`, `accountAccountHeadReadAll`, POST/PUT `accountAccountSubHead`, nested reads for hierarchy display. **UI:** tree or expandable list.

**`/voucher`** — **UI:** voucher list, voucher editor (debit/credit lines), next voucher id chip, print (web uses print components — mobile: PDF preview `printing` package or share sheet). **APIs:** `voucherReadAll`, `voucherReadById`, `voucherReadNextId`, `voucherRead`, POST/PUT/DELETE `voucher`, POST `transaction` when posting.

### Admin

**`/user_management`** — users table, invite/edit, status toggle. **APIs:** `userReadAll`, `userReadById`, POST/PUT `user`, `userUpdateStatus`. **Middleware:** admin-only.

**`/logs`**, **`/logs/settings`** — **APIs:** `GET logs` with filters; `logsSettings`, `logsCleanup`, `logsExport`. **UI:** paginated log table, filter sheet, danger zone cleanup. **Admin-only.**

**`/settings`**, **`/profile`** — profile image upload optional `uploadImage`; password `userProfilePassword`; org theme `organizationTheme` for super branding.

### Organizations (super admin)

**`/organizations`**, **`/[org_id]`**, **`/edit`**, **`/manage-screens`** — **APIs:** full suite from organizations page (`organization`, `tenant-schema/status`, `database/validate`, `database/safe-sync`, `provision`, `health`, `screens` GET/PUT/POST, `backup`, `backup/download`, `tenant-schema/sync-all`). **UI:** heavy forms — use progressive disclosure + confirmation dialogs for destructive ops.

### Reports (each report screen)

Shared pattern: **date range pickers** (`start_dat`, `end_dat`), **Run report** button, **Data table**, **Export** (opens download URL or binary). **Loading:** skeleton table 8 rows. **Empty:** “No rows for selected filters”. **Error:** invalid date range messages.

- **`/reports/accountReports/*`** — APIs per §4.2 account rows.
- **`/reports/saleReports/*`** — `saleReadReportDetail`, downloads, product-wise `saleReadProductWiseReport`, summary `saleDownloadSummary`.
- **`/reports/purchaseReports/*`** — `purchaseReadReportDetail`, downloads, summaries.
- **`/reports/stockReports/*`** — product stock/history endpoints.

### Not found

**Unknown paths** (web `[...slug]`) — friendly 404 + link home.

---

_End of skill — extend §4.2 rows into prose specs per sprint using the standard template in §4.1 as needed._
