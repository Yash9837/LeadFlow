'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, debounce } from '@/lib/utils';
import { updateBuyerStatus } from '@/lib/actions/buyers';
import { type Buyer } from '@/lib/db/schema';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import CSVImport from '@/components/csv-import';
import CSVExport from '@/components/csv-export';

interface BuyersListProps {
  buyers: Buyer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    city?: string;
    propertyType?: string;
    status?: string;
    timeline?: string;
    sort?: string;
  };
}

const columnHelper = createColumnHelper<Buyer>();

const cities = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'];
const propertyTypes = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'];
const statuses = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'];
const timelines = ['0-3m', '3-6m', '>6m', 'Exploring'];

export default function BuyersList({ buyers, pagination, filters }: BuyersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const updateURL = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/buyers?${params.toString()}`);
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      updateURL({ search: value || undefined, page: undefined });
    }, 500),
    [updateURL]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    updateURL({ [key]: value === 'all' ? undefined : value, page: undefined });
  };

  const handleStatusChange = async (buyerId: string, newStatus: string) => {
    try {
      await updateBuyerStatus(buyerId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const columns: ColumnDef<Buyer>[] = [
    columnHelper.accessor('fullName', {
      header: 'Name',
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-sm text-gray-500">{info.row.original.phone}</div>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('city', {
      header: 'City',
    }),
    columnHelper.accessor('propertyType', {
      header: 'Property',
      cell: (info) => {
        const value = info.getValue();
        const bhk = info.row.original.bhk;
        return bhk ? `${value} (${bhk})` : value;
      },
    }),
    columnHelper.accessor('purpose', {
      header: 'Purpose',
    }),
    columnHelper.accessor('budgetMin', {
      header: 'Budget',
      cell: (info) => {
        const min = info.getValue();
        const max = info.row.original.budgetMax;
        if (min && max) {
          return `${formatCurrency(min)} - ${formatCurrency(max)}`;
        } else if (min) {
          return `₹${min.toLocaleString()}+`;
        } else if (max) {
          return `Up to ${formatCurrency(max)}`;
        }
        return '-';
      },
    }),
    columnHelper.accessor('timeline', {
      header: 'Timeline',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusColors = {
          New: 'bg-blue-100 text-blue-800',
          Qualified: 'bg-blue-100 text-blue-800',
          Contacted: 'bg-blue-100 text-blue-800',
          Visited: 'bg-purple-100 text-purple-800',
          Negotiation: 'bg-amber-100 text-amber-800',
          Converted: 'bg-green-100 text-green-800',
          Dropped: 'bg-red-100 text-red-800',
        };
        
        return (
          <select
            value={status}
            onChange={(e) => handleStatusChange(info.row.original.id, e.target.value)}
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        );
      },
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Last Updated',
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Link href={`/buyers/${info.row.original.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View/Edit
          </Button>
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data: buyers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const handleImportComplete = () => {
    // Refresh the page to show new data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <span className="mr-2">🔍</span>
            Search & Filter Leads
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Find the perfect leads with our advanced filtering system</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Search Leads</label>
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <Select value={filters.city || ''} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Property Type</label>
              <Select value={filters.propertyType || ''} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Timeline</label>
              <Select value={filters.timeline || ''} onValueChange={(value) => handleFilterChange('timeline', value)}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="All Timelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timelines</SelectItem>
                  {timelines.map((timeline) => (
                    <SelectItem key={timeline} value={timeline}>{timeline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Lead Management</h3>
            <p className="text-sm text-muted-foreground">
              Showing {buyers.length} of {pagination.total} leads
            </p>
          </div>
          <div className="flex gap-3">
            <CSVImport onImportComplete={handleImportComplete} />
            <CSVExport searchParams={filters} />
          </div>
        </div>
      </div>

      {/* Real Estate Style Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <span className="mr-2">🏠</span>
            Your Lead Portfolio
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Click on any column header to sort your leads</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-foreground"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:bg-blue-100 transition-colors'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}</span>
                            <div className="flex flex-col">
                              {header.column.getIsSorted() === 'asc' && <span className="text-primary text-xs">▲</span>}
                              {header.column.getIsSorted() === 'desc' && <span className="text-primary text-xs">▼</span>}
                              {!header.column.getIsSorted() && <span className="text-gray-300 text-xs">▲</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.map((row, index) => (
                <tr key={row.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {buyers.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🏠</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(f => f && f !== 'all') 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first buyer lead.'
              }
            </p>
            <Button asChild>
              <Link href="/buyers/new">Add Your First Lead</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Page {pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
              <span className="mx-2">•</span>
              <span>{pagination.total} total leads</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => updateURL({ page: (pagination.page - 1).toString() })}
                className="h-9 px-4 border-gray-200 hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateURL({ page: (pagination.page + 1).toString() })}
                className="h-9 px-4 border-gray-200 hover:border-primary hover:text-primary"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
