import { Button } from './UIComponents';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }: PaginationProps) => {
    // Prevent division by zero
    const safeItemsPerPage = itemsPerPage > 0 ? itemsPerPage : 1;
    const totalPages = Math.ceil(totalItems / safeItemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * safeItemsPerPage + 1;
    const endItem = Math.min(currentPage * safeItemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 lg:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">Rows per page:</span>
                <select
                    value={safeItemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                    {startItem}-{endItem} of {totalItems}
                </span>
                <div className="flex gap-1 lg:gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-xs lg:text-sm px-2 lg:px-3"
                    >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">‹</span>
                    </Button>
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="text-xs lg:text-sm px-2 lg:px-3"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">›</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
