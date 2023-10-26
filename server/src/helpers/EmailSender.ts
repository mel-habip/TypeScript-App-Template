import { CourierClient } from "@trycourier/courier";

const courier = CourierClient({ authorizationToken: process.env.EMAIL_COURIER_TOKEN });

type emailProps = {
    to: string,
    cc?: string,
    subject: string,
    body: string,
    attachments?: {
        filename: string,
        contentType: 'application/pdf',
        data: string //base64
    }[]
}

export default async function EmailSender({ to, cc = '', attachments = [], subject, body }: emailProps) {
    const { requestId } = await courier.send({
        message: {
            to: {
                email: to
            },
            content: {
                title: subject,
                body,
            },
            providers: {
                gmail: {
                    override: {
                        attachments
                    }
                }
            },
            routing: {
                method: "single",
                channels: ["email"],
            },
            channels: {
                email: {
                    override: {
                        attachments: [],
                        bcc: "",
                        brand: {},
                        cc,
                        from: "",
                        html: "",
                        reply_to: "",
                        subject: "",
                        text: "",
                        tracking: {
                            open: false
                        }
                    }
                }
            }
        }
    });
    return requestId;
}
