export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    USER: "USER",
}


export const SITE = {
    NAME: process.env.SITE_NAME || "Crush Management System | Switch2itech ",
    LOGO: process.env.LOGO || "/logo/logo.png",
    COMPANY: {
      NAME: process.env.COMPANY_NAME || "Switch2itech",
      ADDRESS: process.env.COMPANY_ADDRESS || "Office #43, Mall Of Sargodha",
      PHONE: process.env.COMPANY_NUMBER || "+92-312-6790728"
    },
  };