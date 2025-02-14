import React, { FC, ReactElement, useContext, useEffect, useRef, useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import "../../../App.scss";
import { useNavigate, useParams } from "react-router-dom";
import {
    Formik, 
    FormikHelpers,
} from "formik";
import * as FormService from "../services/TacRegister"; 
import { AuthContext } from "../../../context/authContext";
import * as Yup from "yup";
import * as FormInput from "../input-fields" 
   
export interface FormProps {
    name?:string
  }

  export const FormConnectedTacRegister: FC<FormProps> = ({
    name="formConnectedTacRegister", 
  }): ReactElement => { 

    const [initialValues, setInitialValues] = useState(new FormService.SubmitRequestInstance);   
    let lastApiSubmission:any = { 
            request: new FormService.SubmitResultInstance,
            response: new FormService.SubmitRequestInstance};     
    const isInitializedRef = useRef(false);

    const navigate = useNavigate();
    const { id } = useParams();
    const contextCode: string = id ?? "00000000-0000-0000-0000-000000000000";
 
    const validationSchema  =  FormService.buildValidationSchema();

    const authContext = useContext(AuthContext);

    let headerErrors:string [] = [];

    const handleInit = (responseFull:any) => {
        
        const initFormResponse: FormService.InitResult = responseFull.data; 

        if(!initFormResponse.success)
        {
            return;
        } 

        setInitialValues({...FormService.buildSubmitRequest(initFormResponse)}); 

    }
    
    const handleValidate = async (values: FormService.SubmitRequest) => {  
        let errors:any = {}
        if (!lastApiSubmission.response.success) {  
            headerErrors = FormService.getValidationErrors("",lastApiSubmission.response); 
            Object.entries(values)
                .forEach(([key, value]) => {
                const fieldErrors:string = FormService.getValidationErrors(key,lastApiSubmission.response).join(','); 
                if(fieldErrors.length > 0 && value == lastApiSubmission.request[key])
                { 
                    errors[key] = fieldErrors;
                }
            })  
        } 
        return errors;
    }

    const submitButtonClick = async (
        values: FormService.SubmitRequest,
        actions: FormikHelpers<FormService.SubmitRequest>
    ) => { 
        try { 
            const responseFull: any = await FormService.submitForm(values);
            const response: FormService.SubmitResult = responseFull.data; 
            lastApiSubmission = { 
                request: {...values},
                response: {...response}}; 
            if (!response.success) {  
                headerErrors = FormService.getValidationErrors("",response); 
                Object.entries(new FormService.SubmitRequestInstance)
                    .forEach(([key, value]) => 
                    actions.setFieldError(key, FormService.getValidationErrors(key,response).join(','))) 
                return;
            }
            authContext.setToken(response.apiKey);
            localStorage.setItem("@token", response.apiKey);
            actions.setSubmitting(false);
            actions.resetForm();  
        } catch (error) {
            actions.setSubmitting(false);
        }
    }; 

    const backToLoginButtonClick = (() => {
        navigate("/tac-login");
    });
    
    useEffect(() => {
        if(isInitializedRef.current){
            return;
        }
        isInitializedRef.current = true;
        FormService.initForm()
        .then(response => handleInit(response));
    },[]); 
    

    return ( 
        <div className="form-container" data-testid="formConnectedTacRegister">
            <Card>
                <h2>Register</h2>
                <h6>Please enter your email and password.</h6>

                <Formik
                    enableReinitialize={true}
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    validate={handleValidate} 
                    onSubmit={async (values,actions) => {await submitButtonClick(values, actions)}}>
                    {(props) => (
                        <Form   
                            className="mb-2"
                            name={name} 
                            data-testid={name}
                            onReset={props.handleReset} 
                            onSubmit={props.handleSubmit}> 
                            <FormInput.ErrorDisplay name="headerErrors" errorArray={headerErrors} />
                            <FormInput.FormInputEmail name="email" label="Email" autoFocus={true} />
                            <FormInput.FormInputPassword name="password" label="Password" /> 
                            <FormInput.FormInputPassword name="confirmPassword" label="Confirm Password" /> 
                            <FormInput.FormInputText name="firstName" label="First Name" /> 
                            <FormInput.FormInputText name="lastName" label="Last Name" /> 
                            <div className="d-flex btn-container">
                                <Button type="submit" data-testid="submit-button">
                                    Register
                                </Button>
                                <Button
                                    onClick={() => {backToLoginButtonClick();}}
                                    variant="secondary"
                                    data-testid="cancel-button"
                                >
                                    Back To Login
                                </Button>
                            </div>
                        </Form>  
                    )}
                </Formik>
            </Card>
        </div> 
    );
};
  
export default FormConnectedTacRegister;
