type HomeSearchBarProps = {
    keyword: string;
    onKeywordChange: (value: string) => void;
    onSubmit: () => void;
};

function HomeSearchBar({ keyword, onKeywordChange, onSubmit }: HomeSearchBarProps) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
            className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm"
        >
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => onKeywordChange(e.target.value)}
                    placeholder="Tìm món ăn, quán ăn..."
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />

                <button
                    type="submit"
                    className="h-12 shrink-0 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                    Tìm
                </button>
            </div>
        </form>
    );
}

export default HomeSearchBar;
