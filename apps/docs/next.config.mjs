import nextra from "nextra";

const withNextra = nextra({});

// Next 16 defaults to Turbopack; Nextra's MDX pipeline still requires Webpack (`next build --webpack`).
export default withNextra();
