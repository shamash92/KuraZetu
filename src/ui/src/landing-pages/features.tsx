import React from "react";
import {Check, Globe, Shield, Users} from "lucide-react";

const features = [
    {
        name: "Community-Driven",
        description:
            "Crowdsource and verify results from 46,000+ polling stations across Kenya",
        icon: Users,
        metric: "46K+",
        metricLabel: "polling stations",
    },
    {
        name: "Transparent",
        description:
            "Real-time dashboard showing verified tallies and community feedback",
        icon: Globe,
        metric: "Real-time",
        metricLabel: "verified tallies",
    },
    {
        name: "Non-Partisan",
        description: "Focused on electoral integrity, not political affiliations",
        icon: Shield,
        metric: "100%",
        metricLabel: "non-partisan",
    },
    {
        name: "Open Source",
        description:
            "Built openly with the community, for maximum transparency and trust",
        icon: Check,
        metric: "Open",
        metricLabel: "source code",
    },
];

export function Features() {
    return (
        <div id="about" className="py-12 md:py-12 bg-stone-50">
            <div className="px-6 mx-auto max-w-7xl lg:px-8">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto mb-20 text-left">
                    <h2 className="mb-8 text-2xl font-light leading-tight tracking-tight text-gray-900 md:text-5xl">
                        "The Power to Watch, Report, and Act — In Your Hands"
                    </h2>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <div key={feature.name} className="group">
                            {/* Metric Display */}
                            <div className="mb-6">
                                <div className="mb-2 text-6xl font-light tracking-tight text-gray-900">
                                    {feature.metric}
                                </div>
                                <div className="text-sm tracking-wider text-gray-500 uppercase">
                                    {feature.metricLabel}
                                </div>
                            </div>

                            {/* Feature Content */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#008751] rounded-lg flex items-center justify-center group-hover:bg-[#006B3F] transition-colors">
                                        <feature.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {feature.name}
                                    </h3>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Stats */}
                <div className="pt-16 mt-24 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <div className="mb-1 text-3xl font-light text-gray-900">
                                290+
                            </div>
                            <div className="text-sm tracking-wider text-gray-500 uppercase">
                                constituencies covered
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 text-3xl font-light text-gray-900">
                                5x
                            </div>
                            <div className="text-sm tracking-wider text-gray-500 uppercase">
                                faster verification
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 text-3xl font-light text-gray-900">
                                99.9%
                            </div>
                            <div className="text-sm tracking-wider text-gray-500 uppercase">
                                accuracy rate
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
