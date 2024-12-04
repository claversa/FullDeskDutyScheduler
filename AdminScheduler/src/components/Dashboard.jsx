import React, { useState } from 'react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    console.log(data)
    const [error, setError] = useState(false);
    const handlesetError = (status) => {
        setError(status);
    }

    const handleFetchUnavailability = async () => {
        try {
            const response = await fetch('http://localhost:5001/all-unavailabilities');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            handlesetError(false);
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleDeleteUnavailability = async (id) => {
        try {
            const response = await fetch(`http://localhost:5001/delete-unavailability/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete the unavailability');
            }

            setData((prevData) => prevData.filter((item) => item._id !== id));
        } catch (error) {
            console.error('Error deleting data:', error);
        }
    };

    const handleDeleteAllUnavailabilities = async () => {
        try {
            const response = await fetch('http://localhost:5001/delete-all-unavailabilities', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete all unavailabilities');
            }

            setData([]); // Clear the data from state as well
            console.log('All unavailabilities deleted successfully');
        } catch (error) {
            console.error('Error deleting all unavailabilities:', error);
        }
    };

    const convertToCSV = (data) => {
        const startHour = 9;
        const endHour = 20;
        const headers = ['day', ...Array.from({ length: endHour - startHour }, (_, i) => `${startHour + i}:00`)];

        const rows = data.map((dayInfo) => {
            console.log(dayInfo.shifts)
            const shifts = dayInfo.shifts.map(shift =>
                `"${shift.assigned}"`
            );
            return [dayInfo.day, ...shifts].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
    };

    const prepareScheduleForSending = (data) => {
        return data.map((dayInfo) => ({
            day: dayInfo.day,
            shifts: dayInfo.shifts.map((shift) => ({
                assigned: (shift.assigned || []).join(', '),
            })),
        }));
    };

    const handleCreateSchedule = async () => {
        try {
            const response = await fetch('http://localhost:5001/run-optimizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                handlesetError(true);
                const errorText = await response.text();
                console.error(`Error: ${response.status} - ${errorText}`);
                return;
            }

            let result = await response.json();
            result = prepareScheduleForSending(result);

            const csvContent = convertToCSV(result);

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'schedule.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error running optimizer:', error.toString());
        }
    };

    return (
        <div className="absolute w-full h-full bg-attila-red">
            <div
                className="absolute inset-0 bg-cover bg-no-repeat bg-left-bottom"
                style={{
                    backgroundImage: `url(./src/assets/attila.png)`,
                    backgroundSize: '400px',
                    backgroundPosition: 'bottom left',
                    height: '100vh',
                }}
            ></div>
            <div className="relative z-10 flex flex-col items-center mt-10">
                <h1 className="text-4xl py-5 text-cream font-bold">Welcome Admin!</h1>
                <h3 className="text-cream">Step 1: Gather all submitted unavailabilities:</h3>
                <button
                    onClick={handleFetchUnavailability}
                    className="flex max-w-fit shadow-md hover:bg-cream border border-cream hover:border-dark-blue hover:text-dark-blue font-semibold bg-dark-blue rounded-lg text-cream text-lg px-3 py-2 my-2"
                >
                    Get Unavailabilities
                </button>
                {data && data.length > 0 && (
                    <div className="border border-1 py-5 px-8 border-dark-blue bg-cream rounded-md mt-6">
                        <button
                            onClick={handleCreateSchedule}
                            className="bg-dark-blue w-fit border border-cream hover:border-dark-blue hover:text-dark-blue hover:bg-cream text-cream font-semibold text-lg mt-8 px-3 shadow-md rounded-lg py-2"
                        >
                            Create Schedule
                        </button>
                        {error && <p className='text-delete-red text-lg font-bold'>Optimizer could not run, availabilities may be too strict.</p>}
                        <button
                            onClick={handleDeleteAllUnavailabilities}
                            className="bg-delete-red w-fit border border-cream hover:border-dark-blue hover:text-dark-blue hover:bg-cream text-cream font-semibold text-lg mt-8 px-3 shadow-md rounded-lg py-2"
                        >
                            Delete All
                        </button>
                        <h2 className="flex justify-center font-bold mb-5 text-dark-blue text-lg">
                            {data.length} RA Unavailabilities
                        </h2>
                        {data.map((item) => (
                            <div key={item._id} className="flex justify-between items-center space-x-4 my-3">
                                <p className="font-medium text-dark-blue capitalize">{item.userName}</p>
                                <button
                                    onClick={() => handleDeleteUnavailability(item._id)}
                                    className="bg-delete-red font-semibold hover:bg-darker-red text-xs text-cream px-3 py-1 rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
