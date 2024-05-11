import { API } from "@/api";
import { PackageType } from "@/schemas";

export async function getPackage(name: string): Promise<PackageType> {
  const gem = await API.getGem(name);
  const versions = await API.getGemVersions(name);

  gem.versions = versions.map((v) => v.number);

  return gem;
}
