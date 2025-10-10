export default function Dates(x) {

    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - x);

    const day = String(pastDate.getDate()).padStart(2, "0");
    const month = String(pastDate.getMonth() + 1).padStart(2, "0");
    const year = String(pastDate.getFullYear()).slice(-2);

    const formattedDate = `${day}/${month}/${year}`;

    return { formattedDate };
}