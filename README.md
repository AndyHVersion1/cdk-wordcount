# Word Count

Send the endpoint a word and count how many times each word has been received
in a dynamodb table.

Send words with
`curl https://<apigateway endpoint>/wc --json '{"word":"brown"}'`

Display table with
`aws dynamodb scan --table-name <table name>`

Display results with
`curl https://<apigateway endpoint>/result`


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
