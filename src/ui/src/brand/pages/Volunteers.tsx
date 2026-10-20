import React from "react";

import {BrandPage} from "../BrandPage";
import {GarmentTile, Hoodie} from "../Garments";

export default function VolunteersPage() {
    return (
        <BrandPage title="Volunteers">
            <div className="kz-brand-grid">
                <GarmentTile caption="Stack">
                    <Hoodie variant="stack" />
                </GarmentTile>
                <GarmentTile caption="Centre">
                    <Hoodie variant="centre" />
                </GarmentTile>
                <GarmentTile caption="Quiet">
                    <Hoodie variant="quiet" />
                </GarmentTile>
            </div>
        </BrandPage>
    );
}
