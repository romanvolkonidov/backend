import styled from 'styled-components';
import DatePicker from 'react-datepicker';

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const InputSection = styled.div`
  flex: 1;
  margin-right: 20px;

  @media (max-width: 768px) {
    margin-right: 0;
    width: 100%;
  }
`;

export const InvoiceSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const InvoicePreview = styled.div`
  margin: 0;
  padding: 0;
  background-color: #fff;
  width: 100%;
  overflow: auto;

  @media (max-width: 768px) {
    width: 100%;
  }

  svg {
    width: 100%;
    height: auto;
  }
`;

export const SaveButton = styled.button`
  display: block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

export const InputField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const StyledDatePicker = styled(DatePicker)`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const ItemInput = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;

  ${InputField} {
    flex: 1;
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const Heading = styled.h2`
  margin-bottom: 20px;
  color: #333;
`;

export const SubHeading = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #555;
`;
export const TemplateSelector = styled.select`
  margin: 10px 0;
  padding: 5px;
  font-size: 16px;
`;