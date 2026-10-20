import React from "react";

import {BrandPage} from "../BrandPage";
import {GarmentTile, Lanyard, Polo} from "../Garments";

export default function AgentsPage() {
    return (
        <BrandPage title="Agents">
            <div className="kz-brand-grid">
                <GarmentTile caption="Ink polo">
                    <Polo variant="ink" />
                </GarmentTile>
                <GarmentTile caption="Stone polo">
                    <Polo variant="stone" />
                </GarmentTile>
                <GarmentTile caption="Lanyard">
                    <Lanyard />
                </GarmentTile>
            </div>
        </BrandPage>
    );
}
