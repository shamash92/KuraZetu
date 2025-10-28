import React from "react";
import {CheckCircle, XCircle} from "lucide-react";

function WhyComponent() {
    const comparisonData = [
        {
            category: "Purpose",
            what_it_is:
                "A citizen-driven platform to increase transparency and accountability",
            what_it_is_not: "Not a system to legally challenge election results",
        },
        {
            category: "Nature",
            what_it_is: "An open-source system built for collaboration",
            what_it_is_not: "Not an official government or IEBC system",
        },
        {
            category: "Approach",
            what_it_is: "A tool for civic empowerment, not political affiliation",
            what_it_is_not: "Not a partisan or politically-affiliated project",
        },
        {
            category: "Function",
            what_it_is:
                "A platform for education, participation, and digital oversight",
            what_it_is_not: "Not a means to announce or declare election results",
        },
        {
            category: "Role",
            what_it_is: "A supplementary tool for civic engagement and transparency",
            what_it_is_not: "Not a replacement for legal electoral processes",
        },
    ];

    return (
        <section id="why" className="w-full py-12 md:py-20 bg-slate-50">
            <div className="container max-w-6xl px-4 mx-auto md:px-6">
                {/* Header */}
                <div className="mb-8 text-center md:mb-12">
                    <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg md:text-sm md:mb-4">
                        Project Clarification
                    </div>
                    <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl md:mb-4">
                        Understanding KuraZetu
                    </h2>
                    <p className="max-w-3xl px-4 mx-auto text-base text-gray-600 md:text-lg md:px-0">
                        Clear understanding of what KuraZetu is and is not helps set
                        proper expectations for civic empowerment and transparency.
                    </p>
                </div>

                {/* Mobile Cards (sm and below) */}
                <div className="space-y-4 md:hidden">
                    {comparisonData.map((row, index) => (
                        <div
                            key={index}
                            className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                        >
                            {/* Category Header */}
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
                                    {row.category}
                                </h3>
                            </div>

                            {/* What It Is */}
                            <div className="px-4 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-medium tracking-wide text-green-700 uppercase">
                                        What It Is
                                    </span>
                                </div>
                                <p className="pl-6 text-sm leading-relaxed text-gray-700">
                                    {row.what_it_is}
                                </p>
                            </div>

                            {/* What It's Not */}
                            <div className="px-4 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-xs font-medium tracking-wide text-red-600 uppercase">
                                        What It's Not
                                    </span>
                                </div>
                                <p className="pl-6 text-sm leading-relaxed text-gray-700">
                                    {row.what_it_is_not}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table (md and above) */}
                <div className="hidden overflow-hidden bg-white border border-gray-200 shadow-sm md:block rounded-xl">
                    {/* Table Header */}
                    <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
                        <div className="px-6 py-4">
                            <h3 className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
                                ASPECT
                            </h3>
                        </div>
                        <div className="px-6 py-4 border-l border-gray-200">
                            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-green-700 uppercase">
                                <CheckCircle className="w-4 h-4" />
                                WHAT IT IS
                            </h3>
                        </div>
                        <div className="px-6 py-4 border-l border-gray-200">
                            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-red-600 uppercase">
                                <XCircle className="w-4 h-4" />
                                WHAT IT'S NOT
                            </h3>
                        </div>
                    </div>

                    {/* Table Rows */}
                    {comparisonData.map((row, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-3 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            } border-b border-gray-100 last:border-b-0`}
                        >
                            {/* Category */}
                            <div className="px-6 py-6">
                                <span className="font-medium text-gray-900">
                                    {row.category}
                                </span>
                            </div>

                            {/* What It Is */}
                            <div className="px-6 py-6 border-l border-gray-200">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed text-gray-700">
                                        {row.what_it_is}
                                    </p>
                                </div>
                            </div>

                            {/* What It's Not */}
                            <div className="px-6 py-6 border-l border-gray-200">
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed text-gray-700">
                                        {row.what_it_is_not}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhyComponent;
