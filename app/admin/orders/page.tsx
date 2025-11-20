"use client"

import { useState, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
} from "@tanstack/react-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, ShoppingBag, Download, Columns3, ArrowUpDown, Trash2 } from "lucide-react"
import type { Order } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/orders")
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, field: "paymentStatus" | "fulfillmentStatus", value: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      const updatedOrder = await response.json()
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder)
      }

      toast({
        title: "Order Updated",
        description: `Order ${field} updated successfully`,
      })
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      })
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      orders.map((o) => ({
        "Order ID": o.id,
        Customer: o.customerName,
        Email: o.customerEmail,
        Phone: o.customerPhone,
        "Total Items": o.items.reduce((sum, item) => sum + item.quantity, 0),
        Total: o.total,
        "Payment Status": o.paymentStatus,
        "Fulfillment Status": o.fulfillmentStatus,
        "Payment Method": o.paymentMethod,
        Date: new Date(o.createdAt).toLocaleString(),
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")
    XLSX.writeFile(workbook, `orders_${new Date().toISOString().split("T")[0]}.xlsx`)

    toast({
      title: "Export Successful",
      description: "Orders exported to Excel",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
      <Badge variant="outline" className={statusStyles[status as keyof typeof statusStyles] || ""}>
        {status}
      </Badge>
    )
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key as any])

    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select orders to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} order(s)?`)) return

    try {
      await Promise.all(
        selectedIds.map((index) => {
          const orderId = orders[Number.parseInt(index)].id
          return fetch(`/api/orders/${orderId}`, { method: "DELETE" })
        }),
      )

      toast({
        title: "Orders Deleted",
        description: `${selectedIds.length} order(s) removed successfully`,
      })

      setRowSelection({})
      fetchOrders()
    } catch (error) {
      console.error("Failed to delete orders:", error)
      toast({
        title: "Error",
        description: "Failed to delete orders",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      size: 120,
    },
    {
      accessorKey: "trackingCode",
      header: "Tracking Code",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.trackingCode || "—"}</span>,
      size: 140,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Customer
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-foreground">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.original.customerEmail}</div>
          <div className="text-xs text-muted-foreground">{row.original.customerPhone}</div>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-center">{row.original.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
      ),
      size: 70,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Total
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-semibold">${row.original.total.toFixed(2)}</span>,
      size: 90,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <Select
          value={row.original.paymentStatus}
          onValueChange={(value) => updateOrderStatus(row.original.id, "paymentStatus", value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      ),
      size: 130,
    },
    {
      accessorKey: "fulfillmentStatus",
      header: "Fulfillment",
      cell: ({ row }) => (
        <Select
          value={row.original.fulfillmentStatus}
          onValueChange={(value) => updateOrderStatus(row.original.id, "fulfillmentStatus", value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      ),
      size: 130,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => <span className="capitalize text-sm">{row.original.paymentMethod}</span>,
      size: 100,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Date
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => viewOrderDetails(row.original)} className="gap-2">
          <Eye className="h-4 w-4" />
          View
        </Button>
      ),
      enableHiding: false,
      size: 90,
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
  })

  return (
    <div className="p-4 sm:p-6 pb-20 md:pb-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Orders Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground">View and manage all customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Total of {orders.length} orders</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.keys(rowSelection).length > 0 && (
                  <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete ({Object.keys(rowSelection).length})
                  </Button>
                )}
                <Button onClick={fetchOrders} variant="outline" size="sm">
                  Refresh
                </Button>
                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Columns3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                placeholder="Search orders..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-full sm:max-w-sm"
              />
              <div className="sm:ml-auto text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} order(s)
                {Object.keys(rowSelection).length > 0 && ` • ${Object.keys(rowSelection).length} selected`}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information for order #{selectedOrder?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Customer Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedOrder.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedOrder.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Shipping Address</h3>
                <div className="text-sm space-y-1">
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{item.card.name}</div>
                        <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.card.price.toFixed(2)} each</div>
                        <div className="text-sm font-semibold">${(item.card.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingFee === 0 ? "FREE" : `$${selectedOrder.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Order Status</h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Payment Status:</span>
                    {getStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Fulfillment Status:</span>
                    {getStatusBadge(selectedOrder.fulfillmentStatus)}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Payment Method:</span>
                    <span className="font-medium capitalize">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Order Date:</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Tracking Code:</span>
                    <span className="font-medium">{selectedOrder.trackingCode || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
