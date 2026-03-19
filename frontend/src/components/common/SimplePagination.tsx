type SimplePaginationProps = {
    page: number;
    onPrev: () => void;
    onNext: () => void;
    disablePrev?: boolean;
    disableNext?: boolean;
};

function SimplePagination({
    page,
    onPrev,
    onNext,
    disablePrev,
    disableNext,
}: SimplePaginationProps) {
    return (
        <div className="mt-6 flex items-center justify-center gap-3">
            <button
                type="button"
                onClick={onPrev}
                disabled={disablePrev}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Trước
            </button>

            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Trang {page}
            </div>

            <button
                type="button"
                onClick={onNext}
                disabled={disableNext}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Sau
            </button>
        </div>
    );
}

export default SimplePagination;
