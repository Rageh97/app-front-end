import Link from "next/link";
interface BreadcrumbProps {
  pageName: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row items-center justify-center mt-3">
      <h2 className="text-title-md2 font-semibold text-white dark:text-white">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium text-[#00c48c]" href="/">
              Dashboard /
            </Link>
          </li>
          <li className="font-medium text-orange">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
