import React, { useState } from 'react';
import { toJpeg } from 'html-to-image';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Container,
  InputSection,
  InvoiceSection,
  InvoicePreview,
  SaveButton,
  InputField,
  StyledDatePicker,
  ItemInput,
  Heading,
  SubHeading,
  TemplateSelector // Ensure this is correctly imported
} from './StyledComponents'; // Adjust the import path as necessary

const saveAsJPEG = () => {
  const node = document.getElementById('invoice');
  toJpeg(node, { quality: 0.95, width: 800, height: 1000 })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'invoice.jpg';
      link.href = dataUrl;
      link.click();
    })
    .catch((error) => {
      console.error('oops, something went wrong!', error);
    });
};

const formatDate = (date) => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const SVGInvoiceGenerator = () => {
  const INITIAL_Y_POSITION = 455; // Initial Y position for the first item
  const ITEM_SPACING = 50; // Spacing between items
  const TOTAL_Y_POSITION = 740; // Y position for the total amount
  const DISCOUNT_Y_POSITION = 685; // Y position for the discount description and amount
  const NOTE_Y_POSITION = 740; // Y position for the note
  const FINAL_TOTAL_Y_POSITION = 850; // Y position for the final total amount

  const [invoiceData, setInvoiceData] = useState({
    payer: '',
    dateFrom: null,
    dateTo: null,
    issueDate: new Date(), // Default to today
    dueDate: null,
    items: [
      { name: '', quantity: '', price: '' },
      { name: '', quantity: '', price: '' },
      { name: '', quantity: '', price: '' },
      { name: '', quantity: '', price: '' },
    ],
    discount: '',
    discountDescription: '',
    note: ''
  });

  const [template, setTemplate] = useState('1.jpg'); // Default template

  const handleInputChange = (e, field) => {
    setInvoiceData({ ...invoiceData, [field]: e.target.value });
  };

  const handleDateChange = (date, field) => {
    setInvoiceData({ ...invoiceData, [field]: date });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((sum, item) => {
      const quantity = isNaN(item.quantity) ? 0 : Number(item.quantity);
      const price = isNaN(item.price) ? 0 : Number(item.price);
      return sum + quantity * price;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!invoiceData.discount) return 0;
    if (invoiceData.discount.includes('%')) {
      const percentage = parseFloat(invoiceData.discount) / 100;
      return calculateTotal() * percentage;
    }
    return parseFloat(invoiceData.discount);
  };

  const calculateFinalTotal = () => {
    const total = calculateTotal();
    const discount = calculateDiscount();
    return total - discount;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Invoice Data Input</h1>
        <input
          className="w-full p-2 mb-4 border rounded"
          value={invoiceData.payer}
          onChange={(e) => handleInputChange(e, 'payer')}
          placeholder="Payer"
        />
        <StyledDatePicker
          className="w-full p-2 mb-4 border rounded"
          selected={invoiceData.dateFrom}
          onChange={(date) => handleDateChange(date, 'dateFrom')}
          placeholderText="Date From"
          dateFormat="dd-MM-yyyy"
        />
        <StyledDatePicker
          className="w-full p-2 mb-4 border rounded"
          selected={invoiceData.dateTo}
          onChange={(date) => handleDateChange(date, 'dateTo')}
          placeholderText="Date To"
          dateFormat="dd-MM-yyyy"
        />
        <StyledDatePicker
          className="w-full p-2 mb-4 border rounded"
          selected={invoiceData.issueDate}
          onChange={(date) => handleDateChange(date, 'issueDate')}
          placeholderText="Issue Date"
          dateFormat="dd-MM-yyyy"
        />
        <StyledDatePicker
          className="w-full p-2 mb-4 border rounded"
          selected={invoiceData.dueDate}
          onChange={(date) => handleDateChange(date, 'dueDate')}
          placeholderText="Due Date"
          dateFormat="dd-MM-yyyy"
        />

        <h2 className="text-xl font-semibold mb-2">Invoice Items</h2>
        {invoiceData.items.map((item, index) => (
          <div key={index} className="flex space-x-4 mb-4">
            <input
              className="flex-1 p-2 border rounded"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder="Item Name"
            />
            <input
              className="flex-1 p-2 border rounded"
              value={item.quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  handleItemChange(index, 'quantity', value);
                }
              }}
              placeholder="Quantity"
            />
            <input
              className="flex-1 p-2 border rounded"
              value={item.price}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  handleItemChange(index, 'price', value);
                }
              }}
              placeholder="Price"
            />
          </div>
        ))}

        <input
          className="w-full p-2 mb-4 border rounded"
          value={invoiceData.discountDescription}
          onChange={(e) => handleInputChange(e, 'discountDescription')}
          placeholder="Discount Description"
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          value={invoiceData.discount}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*\.?\d*%?$/.test(value)) {
              handleInputChange(e, 'discount');
            }
          }}
          placeholder="Discount (e.g., 10 or 10%)"
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          value={invoiceData.note}
          onChange={(e) => handleInputChange(e, 'note')}
          placeholder="Note"
        />

        <h2 className="text-xl font-semibold mb-2">Select Template</h2>
        <select
          className="w-full p-2 mb-4 border rounded"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        >
          <option value="1.jpg">Template 1</option>
          <option value="2.jpg">Template 2</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div id="invoice" className="relative">
          <svg
            viewBox="0 0 800 1000"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <image href={`${process.env.PUBLIC_URL}/${template}`} width="800" height="1000" />
            <text x="254" y="289" fontSize="18" fontWeight="semibold">{invoiceData.payer}</text>
            <text x="194" y="316.5" fontSize="18">{formatDate(invoiceData.dateFrom)}</text>
            <text x="134" y="344" fontSize="18">{formatDate(invoiceData.dateTo)}</text>
            <text x="510" y="286" fontSize="18">{formatDate(invoiceData.issueDate)}</text>
            <text x="600" y="342" fontSize="18">{formatDate(invoiceData.dueDate)}</text>
            
            {invoiceData.items.map((item, index) => {
              const itemTotal = item.quantity * item.price;
              return (
                <g key={index}>
                  <text x="80" y={INITIAL_Y_POSITION + index * ITEM_SPACING} fontSize="18">{item.name}</text>
                  <text x="450" y={INITIAL_Y_POSITION + index * ITEM_SPACING} fontSize="18">{item.quantity}</text>
                  <text x="550" y={INITIAL_Y_POSITION + index * ITEM_SPACING} fontSize="18">{item.price}</text>
                  {itemTotal !== 0 && (
                    <text x="650" y={INITIAL_Y_POSITION + index * ITEM_SPACING} fontSize="18">{itemTotal.toFixed(2)}</text>
                  )}
                </g>
              );
            })}
            
            {invoiceData.discountDescription && (
              <text x="80" y={DISCOUNT_Y_POSITION} fontSize="18">{invoiceData.discountDescription}</text>
            )}
            {invoiceData.discount && (
              <text x="650" y={DISCOUNT_Y_POSITION} fontSize="18">{invoiceData.discount}</text>
            )}
            {invoiceData.note && (
              <text x="80" y={NOTE_Y_POSITION} fontSize="18" fontWeight="bold"> {invoiceData.note}</text>
            )}
            {calculateTotal() !== 0 && (
              <text x="580" y={TOTAL_Y_POSITION} fontSize="16" fontWeight="bold">ИТОГО: {calculateTotal().toFixed(2)}</text>
            )}
            {calculateFinalTotal() !== 0 && (
              <text x="470" y={FINAL_TOTAL_Y_POSITION} fontSize="18" fontWeight="bold">СУММА К ОПЛАТЕ: {calculateFinalTotal().toFixed(2)}</text>
            )}
          </svg>
        </div>
        <button
          className="w-full p-2 mt-4 bg-indigo-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300"
          onClick={saveAsJPEG}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default SVGInvoiceGenerator;