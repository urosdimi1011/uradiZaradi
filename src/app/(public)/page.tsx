import { MajstoriListing } from "./_listing/majstori-listing";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  return <MajstoriListing category={null} searchParams={await searchParams} />;
}
