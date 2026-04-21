type ReleaseGroupDetailPageProps = {
    params: Promise<{
        mbid: string;
    }>;
};

export default async function ReleaseGroupDetailPage({
    params,
}: ReleaseGroupDetailPageProps) {
    const { mbid } = await params;

    return (
        <main className="max-w-150 mx-auto px-6 pt-16 pb-20">
            <p className="mb-3 text-micro uppercase tracking-[0.18em] text-steel">
                Release Group
            </p>
            <h1 className="text-[46px] font-medium text-paper tracking-[-0.02em] leading-[1.05] mb-4">
                Release-group page scaffolded
            </h1>
            <p className="max-w-90 text-body leading-[1.65] text-steel">
                Detail UI is not implemented yet. This route exists so global
                search results can be clickable while the full release-group
                page is still pending.
            </p>
            <div className="mt-8 rounded-md border-[0.5px] border-(--hairline) bg-surface px-4 py-4 text-caption text-paper">
                MBID: <span className="text-steel">{mbid}</span>
            </div>
        </main>
    );
}
