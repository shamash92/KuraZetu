import React from "react";

// Barrel: re-export all color tokens so existing extensionless imports
// (`../_utils/colors`) keep resolving unchanged.
export * from "./legacy";
export * from "./palettes";
export * from "./semantic";
export * from "./perk";

// This directory does not export a React component by default.
// To satisfy the requirement, export a dummy React component as default.

const ColorsComponent: React.FC = () => null;

export default ColorsComponent;
