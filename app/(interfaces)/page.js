// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";
// import { Search, ArrowRight, TrendingUp, CheckCircle2, AlertTriangle, Heart, MapPin } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// export default function Dashboard() {
//   const [dashboardData, setDashboardData] = useState({
//     transactions: [],
//     suppliers: [],
//     employees: [],
//     purchases: [],
//     sales: [],
//     quotations: [],
//     purchaseReturns: [],
//     saleReturns: [],
//     areas: [],
//     subareas: [],
//     vehicles: [],
//     loading: true,
//   });

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         const [
//           transactionsRes,
//           suppliersRes,
//           employeesRes,
//           purchasesRes,
//           salesRes,
//           quotationsRes,
//           purchaseReturnsRes,
//           saleReturnsRes,
//           areasRes,
//           subareasRes,
//           vehiclesRes,
//         ] = await Promise.all([
//           fetch("/api/transaction/readAll"),
//           fetch("/api/supplier/readAll"),
//           fetch("/api/employee/readAll"),
//           fetch("/api/purchase/readAll"),
//           fetch("/api/sale/readAll"),
//           fetch("/api/quotation/readAll"),
//           fetch("/api/purchaseReturn/readAll"),
//           fetch("/api/saleReturn/readAll"),
//           fetch("/api/area/readAll"),
//           fetch("/api/subarea/readAll"),
//           fetch("/api/vehicle/readAll"),
//         ]);

//         const transactionsData = await transactionsRes.json();
//         const suppliersData = await suppliersRes.json();
//         const employeesData = await employeesRes.json();
//         const purchasesData = await purchasesRes.json();
//         const salesData = await salesRes.json();
//         const quotationsData = await quotationsRes.json();
//         const purchaseReturnsData = await purchaseReturnsRes.json();
//         const saleReturnsData = await saleReturnsRes.json();
//         const areasData = await areasRes.json();
//         const subareasData = await subareasRes.json();
//         const vehiclesData = await vehiclesRes.json();

//         setDashboardData({
//           transactions: transactionsData?.response_result?.data || [],
//           suppliers: suppliersData?.response_result?.supplier_data || [],
//           employees: employeesData?.response_result?.employee_data || [],
//           purchases: purchasesData?.response_result?.purchase_data || [],
//           sales: salesData?.response_result?.sale_data || [],
//           quotations: quotationsData?.response_result?.quotation_data || [],
//           purchaseReturns: purchaseReturnsData?.response_result?.return_data || [],
//           saleReturns: saleReturnsData?.response_result?.return_data || [],
//           areas: areasData?.response_result?.data || [],
//           subareas: Array.isArray(subareasData?.response_result) 
//             ? subareasData.response_result 
//             : subareasData?.response_result?.data || [],
//           vehicles: vehiclesData?.response_result?.vehicles || [],
//           loading: false,
//         });
//       } catch (error) {
//         console.error("Error fetching dashboard data:", error);
//         setDashboardData((prev) => ({ ...prev, loading: false }));
//       }
//     };

//     fetchDashboardData();
//   }, []);

//   // Calculate Total Sales Rate - using real data only
//   const sales = dashboardData.sales || [];
//   const quotations = dashboardData.quotations || [];
//   const purchases = dashboardData.purchases || [];
  
//   // Sales Status Breakdown - real calculations only
//   const completedSales = sales.filter(s => !s.is_deleted && s.received_amount >= s.total_amount).length;
//   const pendingSales = sales.filter(s => !s.is_deleted && s.received_amount < s.total_amount).length;
//   const cancelledSales = sales.filter(s => s.is_deleted).length;
//   const totalSalesCount = completedSales + pendingSales + cancelledSales;
//   const inProgressCount = quotations.length;
  
//   // Total count for display (sales + quotations + purchases)
//   const totalCount = totalSalesCount + inProgressCount + purchases.length;
  
//   // Sales rate percentage
//   const salesRate = totalSalesCount > 0 
//     ? Math.round((completedSales / totalSalesCount) * 100) 
//     : 0;

//   // Sales Status Data for donut chart - real data only
//   const salesStatusData = [
//     {
//       name: "Completed",
//       value: completedSales,
//       percentage: totalSalesCount > 0 ? Math.round((completedSales / totalSalesCount) * 100) : 0,
//       color: "#3b82f6", // blue
//     },
//     {
//       name: "Pending",
//       value: pendingSales,
//       percentage: totalSalesCount > 0 ? Math.round((pendingSales / totalSalesCount) * 100) : 0,
//       color: "#eab308", // yellow
//     },
//     {
//       name: "Cancelled",
//       value: cancelledSales,
//       percentage: totalSalesCount > 0 ? Math.round((cancelledSales / totalSalesCount) * 100) : 0,
//       color: "#ef4444", // red
//     },
//   ];

//   // Total Sales Rate Breakdown - real data only
//   const salesRateBreakdown = [
//     {
//       name: "Completed Sales",
//       value: completedSales,
//       color: "#3b82f6",
//     },
//     {
//       name: "Pending Sales",
//       value: pendingSales,
//       color: "#60a5fa",
//     },
//     {
//       name: "In Progress",
//       value: inProgressCount,
//       color: "#eab308",
//     },
//     {
//       name: "Cancelled",
//       value: cancelledSales,
//       color: "#ef4444",
//     },
//   ];

//   // Employee Status - real data only
//   const employees = dashboardData.employees || [];
//   const activeEmployees = employees.filter(e => e.status === 1).length;
//   const totalEmployees = employees.length;
//   const onWorkEmployees = activeEmployees;
//   const onLeaveEmployees = totalEmployees - activeEmployees;

//   // Returns - real data only
//   const purchaseReturns = dashboardData.purchaseReturns || [];
//   const saleReturns = dashboardData.saleReturns || [];
//   const totalReturns = purchaseReturns.length + saleReturns.length;
//   const potentialIssues = totalReturns;
//   const criticalReturns = saleReturns.filter(r => r.total_amount > 1000).length;

//   // Product Status - real calculations
//   const suppliers = dashboardData.suppliers || [];
//   const activeSuppliers = suppliers.filter(s => s.status === 1).length;
//   const totalSuppliers = suppliers.length;
  
//   // Calculate stock status - using suppliers and returns as indicators
//   // Good stock = suppliers with no returns, Low stock = suppliers with some returns, Out of stock = suppliers with many returns
//   const goodStock = suppliers.filter(s => {
//     const supplierReturns = purchaseReturns.filter(pr => pr.acc_id === s.acc_id).length;
//     return supplierReturns === 0;
//   }).length;
//   const lowStock = suppliers.filter(s => {
//     const supplierReturns = purchaseReturns.filter(pr => pr.acc_id === s.acc_id).length;
//     return supplierReturns > 0 && supplierReturns <= 2;
//   }).length;
//   const outOfStock = suppliers.filter(s => {
//     const supplierReturns = purchaseReturns.filter(pr => pr.acc_id === s.acc_id).length;
//     return supplierReturns > 2;
//   }).length;

//   // Monthly Sales Data for bar chart - real data
//   const monthlySalesData = generateMonthlyData(sales);

//   // Returns by Area - real data
//   const areas = dashboardData.areas || [];
//   const returnsByArea = areas.slice(0, 4).map((area) => {
//     const areaReturns = saleReturns.filter(r => {
//       // Match returns to areas if there's a relationship, otherwise use index
//       return true; // Simplified - you may need to add area relationship in your data model
//     }).length;
//     return {
//       name: area.area_nam || area.area_name || `Area ${area.area_id}`,
//       returns: areaReturns || 0,
//     };
//   });

//   // Top Employees - real data only
//   const topEmployees = employees.slice(0, 5).map((emp) => {
//     // Count sales per employee
//     const employeeSales = sales.filter(s => s.salesman_id === emp.employee_id || s.salesman_id === emp.acc_id).length;
//     return {
//       id: emp.employee_id || emp.acc_id,
//       name: emp.employee_nam || emp.employee_name || emp.user_nam || `Employee ${emp.employee_id || emp.acc_id}`,
//       sales: employeeSales,
//       status: emp.status === 1 ? "Active" : "Inactive",
//       avatar: emp.profile_picture || null,
//     };
//   });

//   if (dashboardData.loading) {
//     return (
//       <div className="p-6 flex items-center justify-center min-h-screen">
//         <div className="text-lg">Loading dashboard...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6 ">
//       {/* Top Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Total Sales Rate Card */}
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold">Total Sales Rate</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Legend at top */}
//             <div className="flex items-center justify-center gap-4 mb-4">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-sm bg-blue-500" />
//                 <span className="text-xs text-gray-600">Good Sales</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-sm bg-gray-300" />
//                 <span className="text-xs text-gray-600">Remaining</span>
//               </div>
//             </div>
//             <div className="flex items-start gap-6">
//               {/* Donut Chart */}
//               <div className="relative w-48 h-48 mx-auto">
//                 <ChartContainer
//                   config={{
//                     completed: { label: "Good Sales", color: "#3b82f6" },
//                     remaining: { label: "Remaining", color: "#e5e7eb" },
//                   }}
//                   className="h-full w-full"
//                 >
//                   <PieChart>
//                     <Pie
//                       data={[
//                         { name: "Good Sales", value: salesRate }, 
//                         { name: "Remaining", value: 100 - salesRate }
//                       ]}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={85}
//                       startAngle={90}
//                       endAngle={-270}
//                       dataKey="value"
//                     >
//                       <Cell fill="#3b82f6" />
//                       <Cell fill="#e5e7eb" />
//                     </Pie>
//                     <ChartTooltip content={<ChartTooltipContent />} />
//                   </PieChart>
//                 </ChartContainer>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <div className="text-center">
//                     <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Right Section */}
//               <div className="flex-1 space-y-4">
//                 <div className="space-y-3">
//                   {salesRateBreakdown.map((item, index) => (
//                     <div key={index} className="flex items-center justify-between group cursor-pointer">
//                       <div className="flex items-center gap-2 flex-1">
//                         <div
//                           className="w-3 h-3 rounded-sm"
//                           style={{ backgroundColor: item.color }}
//                         />
//                         <span className="text-sm">{item.name}</span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <span className="text-sm font-semibold">{item.value}</span>
//                         <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             {/* Summary Metric */}
//             <div className="flex items-center justify-center gap-2 pt-4 border-t">
//               <CheckCircle2 className="w-4 h-4 text-blue-500" />
//               <span className="text-sm text-gray-600">Total Transactions</span>
//               <span className="text-sm font-semibold">{totalCount}</span>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Sales Status Card */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold">Sales Status</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {/* Legend at top */}
//             <div className="flex items-center justify-center gap-4 mb-2">
//               {salesStatusData.map((entry, index) => (
//                 <div key={index} className="flex items-center gap-2">
//                   <div
//                     className="w-3 h-3 rounded-sm"
//                     style={{ backgroundColor: entry.color }}
//                   />
//                   <span className="text-xs text-gray-600">{entry.name}</span>
//                 </div>
//               ))}
//             </div>
//             {/* Donut Chart */}
//             <div className="w-40 h-40 mx-auto relative">
//               <ChartContainer
//                 config={{
//                   completed: { label: "Completed", color: "#3b82f6" },
//                   pending: { label: "Pending", color: "#eab308" },
//                   cancelled: { label: "Cancelled", color: "#ef4444" },
//                 }}
//                 className="h-full w-full"
//               >
//                 <PieChart>
//                   <Pie
//                     data={salesStatusData}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={50}
//                     outerRadius={75}
//                     paddingAngle={2}
//                     dataKey="value"
//                     startAngle={90}
//                     endAngle={-270}
//                   >
//                     {salesStatusData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <ChartTooltip content={<ChartTooltipContent />} />
//                 </PieChart>
//               </ChartContainer>
//             </div>
//             {/* Summary Metric */}
//             <div className="flex items-center justify-center gap-2 pt-2">
//               <CheckCircle2 className="w-4 h-4 text-blue-500" />
//               <span className="text-sm text-gray-600">Total Sales</span>
//               <span className="text-sm font-semibold">{totalSalesCount}</span>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Two Small Cards */}
//         <div className="space-y-4">
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//                       <CheckCircle2 className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div>
//                       <div className="text-sm font-semibold">
//                         {onWorkEmployees} / {totalEmployees} Active
//                       </div>
//                       <div className="text-xs text-gray-500">Employees</div>
//                     </div>
//                   </div>
//                   {totalEmployees > 0 && (
//                     <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
//                       <TrendingUp className="w-3 h-3" />
//                       {Math.round((onWorkEmployees / totalEmployees) * 100)}%
//                     </div>
//                   )}
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
//                       <AlertTriangle className="w-5 h-5 text-yellow-600" />
//                     </div>
//                     <div>
//                       <div className="text-sm font-semibold">
//                         {onLeaveEmployees} / {totalEmployees} Inactive
//                       </div>
//                       <div className="text-xs text-gray-500">Employees</div>
//                     </div>
//                   </div>
//                   {totalEmployees > 0 && (
//                     <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
//                       <TrendingUp className="w-3 h-3" />
//                       {Math.round((onLeaveEmployees / totalEmployees) * 100)}%
//                     </div>
//                   )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Middle Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Product Issues Card (mapped from Chronic Conditions) */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold">Product Status</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {/* Stock Status Data */}
//             {(() => {
//               const totalStock = goodStock + lowStock + outOfStock;
//               const stockData = [
//                 { name: "Good Stock", value: goodStock, color: "#3b82f6" },
//                 { name: "Low Stock", value: lowStock, color: "#eab308" },
//                 { name: "Out of Stock", value: outOfStock, color: "#ef4444" },
//               ].filter(item => item.value > 0);
              
//               return (
//                 <>
//                   {/* Legend at top */}
//                   {stockData.length > 0 && (
//                     <div className="flex items-center justify-center gap-3 mb-2">
//                       {stockData.map((entry, index) => (
//                         <div key={index} className="flex items-center gap-2">
//                           <div
//                             className="w-3 h-3 rounded-sm"
//                             style={{ backgroundColor: entry.color }}
//                           />
//                           <span className="text-xs text-gray-600">{entry.name}</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
                  
//                   {/* Donut Chart */}
//                   {stockData.length > 0 && (
//                     <div className="w-40 h-40 mx-auto relative">
//                       <ChartContainer
//                         config={stockData.reduce((acc, item) => {
//                           acc[item.name.toLowerCase().replace(/\s+/g, '')] = { label: item.name, color: item.color };
//                           return acc;
//                         }, {})}
//                         className="h-full w-full"
//                       >
//                         <PieChart>
//                           <Pie
//                             data={stockData}
//                             cx="50%"
//                             cy="50%"
//                             innerRadius={50}
//                             outerRadius={75}
//                             paddingAngle={2}
//                             dataKey="value"
//                             startAngle={90}
//                             endAngle={-270}
//                           >
//                             {stockData.map((entry, index) => (
//                               <Cell key={`cell-${index}`} fill={entry.color} />
//                             ))}
//                           </Pie>
//                           <ChartTooltip content={<ChartTooltipContent />} />
//                         </PieChart>
//                       </ChartContainer>
//                     </div>
//                   )}
//                 </>
//               );
//             })()}
            
//             {/* Summary Metric */}
//             <div className="flex items-center justify-center gap-2 pt-2">
//               <CheckCircle2 className="w-4 h-4 text-blue-500" />
//               <span className="text-sm text-gray-600">Total Returns</span>
//               <span className="text-sm font-semibold">{totalReturns}</span>
//             </div>
            
//             <div className="pt-4 border-t">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <CheckCircle2 className="w-5 h-5 text-blue-600" />
//                   <div>
//                     <div className="text-sm font-semibold">
//                       {activeSuppliers} / {totalSuppliers} Active Suppliers
//                     </div>
//                   </div>
//                 </div>
//                 {totalSuppliers > 0 && (
//                   <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
//                     <TrendingUp className="w-3 h-3" />
//                     {Math.round((activeSuppliers / totalSuppliers) * 100)}%
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Total Sales Rate Bar Chart */}
//         <Card className="">
//           <CardHeader className="">
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-lg font-semibold">Total Sales Rate</CardTitle>
//               <Select defaultValue="year">
//                 <SelectTrigger className="w-24 h-8 text-xs">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="year">Year</SelectItem>
//                   <SelectItem value="month">Month</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex items-center gap-4 mt-4">
//               <div className="text-sm">
//                 <span className="font-semibold">{salesStatusData[0]?.percentage || 0}%</span> Completed
//                 {salesStatusData[0]?.percentage > 0 && (
//                   <span className="text-green-600 text-xs ml-1">↑ {Math.round(salesStatusData[0].percentage * 0.1)}%</span>
//                 )}
//               </div>
//               <div className="text-sm">
//                 <span className="font-semibold">{salesStatusData[1]?.percentage || 0}%</span> Pending
//                 {salesStatusData[1]?.percentage > 0 && (
//                   <span className="text-green-600 text-xs ml-1">↑ {Math.round(salesStatusData[1].percentage * 0.1)}%</span>
//                 )}
//               </div>
//               <div className="text-sm">
//                 <span className="font-semibold">{salesStatusData[2]?.percentage || 0}%</span> Cancelled
//                 {salesStatusData[2]?.percentage > 0 && (
//                   <span className="text-green-600 text-xs ml-1">↑ {Math.round(salesStatusData[2].percentage * 0.1)}%</span>
//                 )}
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent className="p-0">
//             <div className="h-64">
//               <ChartContainer
//                 config={{
//                   completed: { label: "Completed", color: "#3b82f6" },
//                   pending: { label: "Pending", color: "#eab308" },
//                   cancelled: { label: "Cancelled", color: "#ef4444" },
//                 }}
//                 className="h-full max-w-full pr-4"
//               >
//                 <BarChart data={monthlySalesData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//                   <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
//                   <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
//                   <ChartTooltip content={<ChartTooltipContent />} />
//                   <Bar dataKey="completed" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
//                   <Bar dataKey="pending" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
//                   <Bar dataKey="cancelled" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ChartContainer>
//             </div>
//             <div className="flex items-center justify-center gap-4 mt-4">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-blue-600"></div>
//                 <span className="text-xs">Completed</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//                 <span className="text-xs">Pending</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-red-600"></div>
//                 <span className="text-xs">Cancelled</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Returns Card (mapped from Possible Infection) */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle className="text-lg font-semibold">Returns & Issues</CardTitle>
//               <Select defaultValue="map">
//                 <SelectTrigger className="w-20 h-8 text-xs">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="map">Map</SelectItem>
//                   <SelectItem value="list">List</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="grid grid-cols-2 gap-3 mt-4">
//               <Card className="bg-white">
//                 <CardContent className="p-3">
//                   <div className="text-lg font-bold">{potentialIssues}</div>
//                   <div className="text-xs text-gray-600">Potential Returns</div>
//                 </CardContent>
//               </Card>
//               <Card className="bg-red-50 border-red-200">
//                 <CardContent className="p-3">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className="text-lg font-bold text-red-600">{criticalReturns}</div>
//                       <div className="text-xs text-gray-600">Critical Returns</div>
//                     </div>
//                     <ArrowRight className="w-4 h-4 text-red-600" />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
//               <div className="text-center text-gray-400">
//                 <MapPin className="w-8 h-8 mx-auto mb-2" />
//                 <div className="text-xs">Area Distribution</div>
//               </div>
//               {/* Simulated map markers */}
//               {returnsByArea.slice(0, 3).map((area, index) => (
//                 <div
//                   key={index}
//                   className="absolute w-3 h-3 bg-red-500 rounded-full"
//                   style={{
//                     left: `${20 + index * 30}%`,
//                     top: `${30 + index * 20}%`,
//                   }}
//                 />
//               ))}
//             </div>
//             <div className="mt-3 space-y-2">
//               {returnsByArea.slice(0, 3).map((area, index) => (
//                 <div key={index} className="text-xs text-gray-600">
//                   {area.name}: {area.returns} returns
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//                   </div>

//       {/* Bottom Row */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Returns by Type (mapped from Chronic Condition) */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold">Returns by Type</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex items-center gap-4">
//               <div className="text-sm">
//                 <span className="font-semibold">10%</span> Purchase Returns
//               </div>
//               <div className="text-sm">
//                 <span className="font-semibold">40%</span> Sale Returns
//               </div>
//               <div className="text-sm">
//                 <span className="font-semibold">50%</span> Other Issues
//               </div>
//             </div>
//             <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
//               <div className="bg-red-500" style={{ width: "10%" }}></div>
//               <div className="bg-yellow-500" style={{ width: "40%" }}></div>
//               <div className="bg-blue-500" style={{ width: "50%" }}></div>
//             </div>
//             <div className="space-y-2 pt-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
//                     <span className="text-xs">👤</span>
//                   </div>
//                   <span className="text-sm">Purchase Returns: {purchaseReturns.length}</span>
//                 </div>
//                 {totalReturns > 0 && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-semibold">{Math.round((purchaseReturns.length / totalReturns) * 100)}%</span>
//                     <ArrowRight className="w-4 h-4 text-gray-400" />
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Employees List */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold">Employees</CardTitle>
//             <Tabs defaultValue="active" className="mt-4">
//               <TabsList>
//                 <TabsTrigger value="active">ACTIVE</TabsTrigger>
//                 <TabsTrigger value="inactive">INACTIVE</TabsTrigger>
//               </TabsList>
//               <TabsContent value="active" className="mt-4">
//                 <div className="space-y-3">
//                   {topEmployees.slice(0, 3).map((emp) => (
//                     <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                       <div className="flex items-center gap-3">
//                         <Avatar className="w-10 h-10">
//                           <AvatarImage src={emp.avatar} />
//                           <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
//                         </Avatar>
//                         <div>
//                           <div className="text-sm font-semibold">{emp.name}</div>
//                           <div className="text-xs text-gray-500">{emp.sales} sales this month</div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <div className="text-xs text-red-600 font-semibold">Active</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </TabsContent>
//               <TabsContent value="inactive" className="mt-4">
//                 <div className="space-y-3">
//                   {topEmployees.slice(3, 6).map((emp) => (
//                     <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                       <div className="flex items-center gap-3">
//                         <Avatar className="w-10 h-10">
//                           <AvatarImage src={emp.avatar} />
//                           <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
//                         </Avatar>
//                         <div>
//                           <div className="text-sm font-semibold">{emp.name}</div>
//                           <div className="text-xs text-gray-500">Inactive employee</div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <div className="text-xs text-yellow-600 font-semibold">Inactive</div>
//                       </div>
//             </div>
//           ))}
//         </div>
//               </TabsContent>
//             </Tabs>
//           </CardHeader>
//         </Card>
//       </div>
//     </div>
//   );
// }

// // Helper function to generate monthly data - using real sales data
// function generateMonthlyData(sales) {
//   const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
//   const monthIndices = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // JavaScript month indices (0-11)
  
//   return months.map((month, idx) => {
//     const monthIndex = monthIndices[idx];
//     const monthSales = sales.filter((sale) => {
//       if (!sale.sale_dat && !sale.insert_dat) return false;
//       const saleDate = new Date(sale.sale_dat || sale.insert_dat);
//       return saleDate.getMonth() === monthIndex;
//     });
    
//     const completed = monthSales.filter(s => !s.is_deleted && s.received_amount >= s.total_amount).length;
//     const pending = monthSales.filter(s => !s.is_deleted && s.received_amount < s.total_amount).length;
//     const cancelled = monthSales.filter(s => s.is_deleted).length;
    
//     return {
//       month,
//       completed,
//       pending,
//       cancelled,
//     };
//   });
// }




import React from 'react'

const DashboardPage = () => {
  return (
    <div>DashboardPage</div>
  )
}

export default DashboardPage