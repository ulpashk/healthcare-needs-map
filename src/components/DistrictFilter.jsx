import {useState} from "react";

export default function DistrictFilter({districts, onFilter}) {
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedDistrict(value);
        onFilter(value); // Pass selection to parent
    };

    return (
        <div className="mb-4">
            <label className="text-left block mb-2 font-medium text-gray-700">Район:</label>
            <select
                value={selectedDistrict}
                onChange={handleChange}
                className="w-full md:w-60 p-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500"
            >
                <option value="">Все районы</option>
                {districts.map((district, idx) => (
                    <option key={idx} value={district}>
                        {district}
                    </option>
                ))}
            </select>
        </div>
    )
}