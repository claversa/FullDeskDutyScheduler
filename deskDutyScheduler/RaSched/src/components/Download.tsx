// import { Dropbox } from 'dropbox';
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useForm } from 'react-hook-form';


// DO NOT NEED


// const ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;
// const dropbox = new Dropbox({ accessToken: ACCESS_TOKEN })



interface Unavailability {
    [day: string]: number[]; // object where key is day and value is an array of numbers
}

interface Interval {
    start: number;
    end: number
}




// hours will be 9-20
const Download = () => {
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

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
    };

    const handleIntervalChange = (day: string, index: number, field: "start" | "end", value: number) => {
        const newIntervals = { ...intervals };
        console.log(newIntervals);
        newIntervals[day][index][field] = value;
        setIntervals(newIntervals);
    }

    const addInterval = (day: string) => {
        const newIntervals = { ...intervals };
        newIntervals[day].push({ start: 9, end: 10 });
        setIntervals(newIntervals);
    }
    const removeInterval = (day: string, index: number) => {
        const currIntervals = { ...intervals };
        currIntervals[day].splice(index, 1); // replace elem at index 1 with "" nothing
        setIntervals(currIntervals);
    }

    useEffect(() => {

        const newUnavailability: Unavailability = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
        }
        Object.keys(intervals).forEach((day) => {
            intervals[day].forEach((interval) => {
                const { start, end } = interval; // destructure interval
                for (let i = start; i < end; i++) {
                    newUnavailability[day].push(i);
                }
                console.log(newUnavailability);


            })
        })
        setUnavailability(newUnavailability);

    }, [intervals]);

    const convertToCSV = () => {
        const csvdata = [];

        // const headerRow = ['Name', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        // csvdata.push(headerRow);

        const dataRow = []
        dataRow.push(unavailability.Monday,
            unavailability.Tuesday,
            unavailability.Wednesday,
            unavailability.Thursday,
            unavailability.Friday);
        csvdata.push(dataRow);

        const csvStr = Papa.unparse(csvdata);
        return csvStr;
    }

    const downloadCSV = (csvStr: string) => {
        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `${userName}-unavailable.csv`);
        a.click();
    };

    const onSubmit = () => {
        const csvStr = convertToCSV();
        downloadCSV(csvStr);
        reset();
    };






    return (
        <form className='flex flex-col items-center mt-20' onSubmit={handleSubmit(onSubmit)}>
            <input className='hover:shadow-md shadow-lg py-2 px-3 mb-10 rounded-lg' type="text" value={userName} onChange={handleNameChange} placeholder='Name' required />
            <h3 className='font-lg text-red-800 font-bold mb-4'>Please indicate your UNavailability in intervals</h3>
            <div className='flex justify-center text-center flex-row gap-4'>
                {Object.keys(intervals).map((day) =>
                    <div className='w-48 flex-shrink-0 rounded-lg bg-slate-100 px-2 py-2' key={day}>
                        <h3 className='font-lg text-red-800 font-bold'>{day}</h3>
                        {intervals[day].map((interval, index) => (
                            <div key={index} className='mb-4'>
                                <div className='flex flex-row justify-center'>
                                    <input className='w-12 rounded-lg shadow-lg text-center' type="number" value={interval.start} onChange={(e) => handleIntervalChange(day, index, 'start', parseInt(e.target.value))} min={9} max={19} placeholder="start" required />
                                    <p>-</p>
                                    <input className='w-12 rounded-lg shadow-lg text-center' type="number" value={interval.end} onChange={(e) => handleIntervalChange(day, index, 'end', parseInt(e.target.value))} min={interval.start + 1} max={20} placeholder='end' required />
                                    <button className='hover:bg-red-500 ml-4 shadow-lg rounded-lg text-white text-xs px-2 py-1 bg-red-600' onClick={() => removeInterval(day, index)}>Remove</button>
                                </div>
                            </div>
                        ))}
                        <button className='hover:bg-blue-400 rounded-lg bg-blue-500 text-white text-xs py-1 px-2' type="button" onClick={() => addInterval(day)}>
                            + Add Interval
                        </button>
                    </div>)}
            </div>
            <button className='px-4 py-2 hover:bg-green-500 bg-green-600 text-white rounded-lg mt-7' type="submit">Submit</button>
        </form>
    )
}

export default Download;