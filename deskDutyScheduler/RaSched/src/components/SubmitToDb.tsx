import React, { useEffect, useState } from 'react';
// import Papa from 'papaparse';
import { useForm } from 'react-hook-form';



interface Unavailability {
    [day: string]: number[]; // object where key is day and value is an array of numbers
}

interface Interval {
    start: number;
    end: number
}




// hours will be 9-20
const SubmitToDb = () => {
    const { handleSubmit, reset } = useForm();

    const [unavailability, setUnavailability] = useState<Unavailability>({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
    })

    const [intervals, setIntervals] = useState<{ [day: string]: Interval[] }>({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
    });
    const [userName, setUserName] = useState<string>('');

    const militaryToTwelveHour = (hour: number) => {
        return hour % 12 || 12; // Convert 0-23 to 1-12 scale
        // if (hour >= 9 && hour <= 11) return hour; // AM times
        // if (hour === 12) return 12; // Noon
        // if (hour >= 13 && hour <= 20) return hour - 12; // PM times
        // else throw `Error: ${hour} is not within bounds`;

    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
    };

    const handleIntervalChange = (day: string, index: number, field: "start" | "end", hour: number) => {
        const newIntervals = { ...intervals };
        newIntervals[day][index][field] = hour;
        // newIntervals[day][index][field] = militaryToTwelveHour(hour);
        setIntervals(newIntervals);
    };

    const addInterval = (day: string) => {
        // const newIntervals = { ...intervals };
        // newIntervals[day].push({ start: 9, end: 10 });
        // setIntervals(newIntervals);
        // console.log("intervals after addition: ", intervals)
        // i have to make it somehow so that it checks that days last interval END added and adds the next one starting at the one above
        const newIntervals = { ...intervals };
        const lastInterval = newIntervals[day].at(-1);

        const start = lastInterval ? lastInterval.end + 1 : 9; // Default start to the end of the last interval or 9
        const end = Math.min(start + 1, 20); // End an hour later, within bounds

        newIntervals[day].push({ start, end });
        setIntervals(newIntervals);
    }
    const removeInterval = (day: string, index: number) => {
        const currIntervals = { ...intervals };
        currIntervals[day].splice(index, 1); // replace elem at index 1 with "" nothing
        setIntervals(currIntervals);
        // console.log("intervals after removal: ", intervals)

    }

    useEffect(() => {

        const newUnavailability: Unavailability = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
        };

        Object.keys(intervals).forEach((day) => {
            const daySet = new Set<number>(); // Use a Set to keep hours unique

            intervals[day].forEach((interval) => {
                const { start, end } = interval;
                for (let i = start; i < end; i++) {
                    daySet.add(i); // Add hours to the Set to ensure uniqueness
                }
            });

            newUnavailability[day] = Array.from(daySet).sort((a, b) => a - b); // Convert Set to array and sort it
        });

        setUnavailability(newUnavailability);
    }, [intervals]);


    const onSubmit = async () => {
        // Transform unavailability to use day names with comma-separated unavailable hours
        const formattedUnavailability: { [key: string]: string } = Object.keys(unavailability).reduce((acc, day) => {
            acc[day] = unavailability[day].join(','); // Converts each day's unavailability array to a comma-separated string
            return acc;
        }, {} as { [key: string]: string });

        const unavailabilityData = {
            userName,
            unavailability: formattedUnavailability,
        };

        try {
            console.log('Sending data:', unavailabilityData);  // Check what is being sent
            const response = await fetch('http://localhost:5000/api/unavailability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(unavailabilityData),
            });

            if (!response.ok) {
                throw new Error('Failed to save unavailability data');
            }

            console.log("Unavailability data submitted successfully!");
        } catch (error) {
            console.error('Error submitting data:', error);
        }

        console.log("Submission complete");


        setIntervals({
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        });
        setUserName('');
        reset({
            userName: '',
            intervals: {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: []
            }
        });
    };












    return (
        <div className='bg-attila-red'>
            <div className='relative' style={{
                backgroundImage: `url(./src/assets/attila.png)`,
                backgroundSize: '400px',
                backgroundPosition: 'bottom left',
                backgroundRepeat: 'no-repeat',
                opacity: "60",
                height: '100vh',
            }}>
                {/* <img src='./src/assets/stevens-logo.png' alt='stevens logo' height={100} width={100}></img> */}
                <form className='flex flex-col items-center pt-14 mb-16' onSubmit={handleSubmit(onSubmit)}>
                    <h1 className='text-4xl  mb-5 text-cream font-bold'>Welcome RA!</h1>
                    <input className=' bg-cream py-2 text-dark-blue px-3 mb-8 rounded-lg' type="text" value={userName} onChange={handleNameChange} placeholder='Name' required />
                    <h3 className='text-xl text-cream font-bold mb-2'>Please indicate your UNavailability in intervals</h3>
                    <div className='flex content-center flex-row gap-x-4'><h4 className='text-sm text-cream font-bold'>Note:</h4>
                        <ul className='text-sm text-cream mb-4'>
                            <li>The end hour is NOT included in the unavailability.</li>
                            <li>Shifts only occur between 9am and 8pm so there are no AM and PM distinctions.</li>
                        </ul></div>

                    <div className='flex justify-center text-center flex-row gap-4'>
                        {Object.keys(intervals).map((day) =>
                            <div className='w-52 border-2 text-lg bg-cream border-dark-blue rounded-lg bg-slate-100 px-2 py-2' key={day}>
                                <h3 className='font-lg text-dark-blue mb-2 font-bold'>{day}</h3>
                                {intervals[day].map((interval, index) => (
                                    <div key={index} className='mb-4'>
                                        <div className='flex flex-row justify-center'>
                                            {/* <select
                                                value={interval.start % 12 || 12}
                                                onChange={(e) => handleIntervalChange(day, index, 'start', parseInt(e.target.value))}
                                                className='w-11 rounded-lg shadow-lg text-center'
                                                required
                                            >
                                                {[...Array(11).keys()].map(hour => {
                                                    const hour24 = hour + 9; // Convert to 24-hour format (9 to 19)
                                                    const displayHour = hour24 > 12 ? hour24 - 12 : hour24;
                                                    // const period = hour24 >= 12 ? 'PM' : 'AM';
                                                    return (
                                                        <option key={hour24} value={hour24}>
                                                            {displayHour}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <span className='mx-2'>to</span>
                                            <select
                                                value={interval.end % 12 || 12}
                                                onChange={(e) => handleIntervalChange(day, index, 'end', parseInt(e.target.value))}
                                                className='w-11 rounded-lg shadow-lg text-center'
                                                required
                                            >
                                                {[...Array(11).keys()].map(hour => {
                                                    const hour24 = hour + 10; // Convert to 24-hour format (10 to 20)
                                                    const displayHour = hour24 > 12 ? hour24 - 12 : hour24;
                                                    // const period = hour24 >= 12 ? 'PM' : 'AM';
                                                    return (
                                                        <option key={hour24} value={hour24}>
                                                            {displayHour}
                                                        </option>
                                                    );
                                                })}
                                            </select> */}
                                            <select
                                                value={interval.start}
                                                onChange={(e) => handleIntervalChange(day, index, 'start', parseInt(e.target.value))}
                                                required
                                            >
                                                {[...Array(11).keys()].map(i => {
                                                    const hour24 = i + 9;
                                                    return (
                                                        <option key={hour24} value={hour24}>
                                                            {militaryToTwelveHour(hour24)}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <span> to </span>
                                            <select
                                                value={interval.end}
                                                onChange={(e) => handleIntervalChange(day, index, 'end', parseInt(e.target.value))}
                                                required
                                            >
                                                {[...Array(11).keys()].map(i => {
                                                    const hour24 = i + 10;
                                                    return (
                                                        <option key={hour24} value={hour24}>
                                                            {militaryToTwelveHour(hour24)}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {/* <input className='w-12 rounded-lg shadow-lg text-center' type="number" value={interval.start} onChange={(e) => handleIntervalChange(day, index, 'start', parseInt(e.target.value))} min={9} max={19} placeholder="start" required />
                                            <p>-</p>
                                            <input className='w-12 rounded-lg shadow-lg text-center' type="number" value={interval.end} onChange={(e) => handleIntervalChange(day, index, 'end', parseInt(e.target.value))} min={interval.start + 1} max={20} placeholder='end' required /> */}
                                            <button type="button" className='hover:bg-darker-red ml-4 shadow-lg rounded-lg text-white text-xs px-2 py-1 bg-delete-red' onClick={() => removeInterval(day, index)}>Remove</button>
                                        </div>
                                        {/* <p className='text-sm mt-1'>{militaryToTwelveHour(interval.start)} - {militaryToTwelveHour(interval.end)}</p> */}

                                    </div>
                                ))}
                                <button className='hover:bg-cream hover-border-dark-blue rounded-lg border bg-dark-blue text-white hover:text-dark-blue text-sm font-semibold py-1 px-2' type="button" onClick={() => addInterval(day)}>
                                    + Add Interval
                                </button>
                            </div>)}
                    </div>
                    <button className='px-4 py-2 border border-cream hover:border-dark-blue hover:bg-cream bg-dark-blue font-semibold hover:text-dark-blue text-cream rounded-lg mt-7' type="submit">Submit</button>
                </form>
            </div>
        </div >
    )
}

export default SubmitToDb;