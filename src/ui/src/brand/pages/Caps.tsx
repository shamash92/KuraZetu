import React from "react";

import {BrandPage} from "../BrandPage";
import {Beanie, Cap, GarmentTile} from "../Garments";

export default function CapsPage() {
    return (
        <BrandPage title="Caps">
            <div className="kz-brand-grid">
                <GarmentTile caption="Ink">
                    <Cap variant="ink" />
                </GarmentTile>
                <GarmentTile caption="Stone, ink brim">
                    <Cap variant="stone" />
                </GarmentTile>
                <GarmentTile caption="Beanie, woven tab">
                    <Beanie />
                </GarmentTile>
            </div>
        </BrandPage>
    );
}
