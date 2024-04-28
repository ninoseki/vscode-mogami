import type { PypiPackageType } from "@/schemas";

export function buildHoverMessage(pkg: PypiPackageType): string {
  const url = (() => {
    // Select URL to display by following the order
    // - home_page
    // - project_url
    // - package_url
    if (pkg.info.homePage && pkg.info.homePage !== "") {
      return pkg.info.homePage;
    }
    if (pkg.info.projectUrl && pkg.info.projectUrl !== "") {
      return pkg.info.projectUrl;
    }
    return pkg.info.packageUrl || "N/A";
  })();

  return `${pkg.info.summary}\n\nLatest version: ${pkg.info.version}\n\n${url}`;
}
