import axios from "axios";
import { CONSTANTS } from "../../common/constants";

export async function cloudFlareInvalidateCache(): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/zones/${CONSTANTS.CLOUDFLARE.ZONE_ID}/purge_cache`;

  try {
    await axios.post(
      url,
      {
        purge_everything: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONSTANTS.CLOUDFLARE.API_TOKEN}`,
        },
      }
    );

    console.log(`Cache invalidated for route`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      throw new Error(
        `Failed to invalidate cache: ${
          errorData.errors ? errorData.errors[0].message : "Unknown error"
        }`
      );
    } else {
      throw new Error("Failed to invalidate cache: Unknown error");
    }
  }
}
