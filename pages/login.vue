<template lang="pug">
    a-form(:form="form", @submit.prevent="handleSubmit")
        a-form-item
            a-input(type="text", v-decorator="formRules.email", size="large", placeholder="E-mail")
                a-icon(slot="prefix", type="user")
        a-form-item
            a-input(type="password", v-decorator="formRules.password", size="large", placeholder="Password")
                a-icon(slot="prefix", type="lock")
        a-form-item
            a-button(type="primary", size="large", html-type="submit", block) Login
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { getErrors } from '@/utils/helpers';
import { Meta } from '@/utils/decorators';

@Component
export default class Login extends Vue {
    form: any;
    formRules: any;
    errors: string[] = [];

    beforeCreate() {
        this.formRules = {
            email: [
                'email',
                {
                    rules: [
                        { required: true, message: 'E-mail is required' },
                        {
                            type: 'email',
                            message: 'E-mail is not in valid form'
                        }
                    ]
                }
            ],
            password: [
                'password',
                {
                    rules: [{ required: true, message: 'Password is required' }]
                }
            ]
        };
        this.form = this.$form.createForm(this);
    }

    @Meta
    head() {
        return {
            title: 'Login'
        };
    }

    async handleSubmit(): Promise<any> {
        this.form.validateFields(async (err: any, values: any) => {
            if (!err) {
                try {
                    await this.$auth.loginWith('localGraphQL', {
                        email: values.email,
                        password: values.password
                    });
                } catch (error) {
                    this.errors = getErrors(error);
                    this.form.resetFields();
                }
            }
        });
    }
}
</script>
