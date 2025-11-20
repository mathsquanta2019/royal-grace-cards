"use client"

import type React from "react"

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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Package, Download, Columns3, ArrowUpDown, X, ImagePlus } from "lucide-react"
import type { Card as ProductCard } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import * as XLSX from "xlsx"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<ProductCard | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    inStock: true,
    inventory: "",
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        category: editingProduct.category,
        inStock: editingProduct.inStock,
        inventory: editingProduct.inventory.toString(),
      })
      setUploadedImages(editingProduct.images || [])
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        inStock: true,
        inventory: "",
      })
      setUploadedImages([])
    }
  }, [editingProduct])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cards")
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // We accept only the first image for the main product image
    const file = files[0]

    // If we are editing an existing product, upload directly to the card image API
    if (editingProduct) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", file, file.name)
        const res = await fetch(`/api/cards/${editingProduct.id}/image`, { method: "POST", body: fd as any })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Upload failed")
        // Backend returns url; also it patches the card's imageUrl. Use that url for preview.
        const url: string = data.url || `/api/cards/${editingProduct.id}/image`
        setUploadedImages([url])
        toast({ title: "Image uploaded", description: `${file.name} uploaded successfully` })
      } catch (err) {
        console.error("Failed to upload product image:", err)
        toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" })
      } finally {
        setUploading(false)
      }
      return
    }

    // Otherwise (creating new product): store for later upload after product is created
    setPendingImageFile(file)
    const localPreview = URL.createObjectURL(file)
    setUploadedImages([localPreview])
    toast({ title: "Image selected", description: `${file.name} will be uploaded when you save the product.` })
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (uploadedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image",
        variant: "destructive",
      })
      return
    }

    try {
      const productData = {
        ...formData,
        imageUrl: uploadedImages[0],
      }

      if (editingProduct) {
        const response = await fetch(`/api/cards/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })

        if (!response.ok) throw new Error("Failed to update product")

        // Image already handled during selection in edit mode

        toast({
          title: "Product Updated",
          description: "Product has been updated successfully",
        })
      } else {
        const response = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })

        if (!response.ok) throw new Error("Failed to create product")

        const created = await response.json().catch(() => null)
        // If a new product is created and we have a pending image file, upload it now
        if (created?.id && pendingImageFile) {
          const fd = new FormData()
          fd.append("file", pendingImageFile, pendingImageFile.name)
          const upRes = await fetch(`/api/cards/${created.id}/image`, { method: "POST", body: fd as any })
          if (!upRes.ok) {
            console.error("Post-create image upload failed", await upRes.text())
          }
        }

        toast({
          title: "Product Created",
          description: "New product has been added successfully",
        })
      }

      setIsDialogOpen(false)
      setEditingProduct(null)
      setUploadedImages([])
      setPendingImageFile(null)
      fetchProducts()
    } catch (error) {
      console.error("Failed to save product:", error)
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/cards/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete product")

      toast({
        title: "Product Deleted",
        description: "Product has been removed successfully",
      })

      fetchProducts()
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: ProductCard) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setUploadedImages([])
    setIsDialogOpen(false)
    setTimeout(() => setIsDialogOpen(true), 100)
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        ID: p.id,
        Name: p.name,
        Description: p.description,
        Price: p.price,
        Category: p.category,
        Inventory: p.inventory,
        "In Stock": p.inStock ? "Yes" : "No",
      })),
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products")
    XLSX.writeFile(workbook, `products_${new Date().toISOString().split("T")[0]}.xlsx`)

    toast({
      title: "Export Successful",
      description: "Products exported to Excel",
    })
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key as any])

    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select products to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) return

    try {
      await Promise.all(
        selectedIds.map((index) => {
          const productId = products[Number.parseInt(index)].id
          return fetch(`/api/cards/${productId}`, { method: "DELETE" })
        }),
      )

      toast({
        title: "Products Deleted",
        description: `${selectedIds.length} product(s) removed successfully`,
      })

      setRowSelection({})
      fetchProducts()
    } catch (error) {
      console.error("Failed to delete products:", error)
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<ProductCard>[] = [
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
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
          {row.original.imageUrl ? (
            <Image src={row.original.imageUrl} alt={row.original.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
              No image
            </div>
          )}
        </div>
      ),
      enableSorting: false,
      size: 60,
    },
    {
      accessorKey: "id",
      header: "Product ID",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      size: 100,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Product Name
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[250px]">
          <div className="font-medium text-foreground">{row.original.name}</div>
          <div className="text-xs text-muted-foreground break-words">{row.original.description}</div>
        </div>
      ),
      size: 250,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
      size: 100,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Price
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">${row.original.price.toFixed(2)}</span>,
      size: 80,
    },
    {
      accessorKey: "inventory",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 hover:bg-transparent"
        >
          Stock
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className={row.original.inventory < 20 ? "text-destructive font-semibold" : ""}>
          {row.original.inventory}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: "inStock",
      header: "Status",
      cell: ({ row }) =>
        row.original.inStock ? (
          <Badge variant="default">In Stock</Badge>
        ) : (
          <Badge variant="secondary">Out of Stock</Badge>
        ),
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)} className="h-8 px-2">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableHiding: false,
      size: 100,
    },
  ]

  const table = useReactTable({
    data: products,
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
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Product Management</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Add, edit, and manage your greeting card inventory</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your greeting card inventory</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.keys(rowSelection).length > 0 && (
                  <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete ({Object.keys(rowSelection).length})
                  </Button>
                )}
                <Button onClick={handleAddNew} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
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
                placeholder="Search products..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-full sm:max-w-sm"
              />
              <div className="sm:ml-auto text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} product(s)
                {Object.keys(rowSelection).length > 0 && ` • ${Object.keys(rowSelection).length} selected`}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new greeting card to your store"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Product Images *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted">
                        {url ? (
                          <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs" variant="default">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                  <label className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </label>
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Uploading images...</p>}
                <p className="text-sm text-muted-foreground">
                  Upload product images. First image will be the primary image.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Merry Christmas from Texas"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Beautiful Texas-themed Christmas card..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="4.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory Quantity *</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                  required
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="Christmas"
                />
              </div>

              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="inStock" className="cursor-pointer">
                  In Stock
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
