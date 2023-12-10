from pyteal import *
import program

def approval():
    
    local_certificate_cid = Bytes("cid")
    local_verification_fee = Bytes("verification_fee")
    local_certificate_id = Bytes("certificate_id")
    local_student_id = Bytes("student_id")
    local_student_full_name = Bytes("student_name")
    local_issue_date = Bytes("issue_date")
    local_verification_result = Bytes("verification_result")

    op_issue = Bytes("issue")
    op_verify = Bytes("verify")

    @Subroutine(TealType.none)
    def get_ready(account: Expr): 
        return Seq(
            App.localPut(account, local_certificate_cid, Bytes("")),
            App.localPut(account, local_certificate_id, Bytes("")),
            App.localPut(account, local_student_id, Bytes("")),
            App.localPut(account, local_student_full_name, Bytes("")),
            App.localPut(account, local_issue_date, Bytes("")),
            App.localPut(account, local_verification_fee, Int(0)),
            App.localPut(account, local_verification_result, Bytes(""))
        )
    
    @Subroutine(TealType.uint64)
    def check_local_variables(account: Expr):
        return Return(
            And(
                App.localGet(account, local_certificate_cid) == Bytes(""),
                App.localGet(account, local_certificate_id) == Bytes(""),
                App.localGet(account, local_student_id) == Bytes(""),
                App.localGet(account, local_student_full_name) == Bytes(""),
                App.localGet(account, local_issue_date) == Bytes(""),
                App.localGet(account, local_verification_fee) == Int(0),
                App.localGet(account, local_verification_result) == Bytes(""),
            )
        )
    
    perform_checks_for_issuing = Assert(
        And(
            Global.group_size() == Int(1),

            Txn.group_index() == Int(0),

            Gtxn[0].rekey_to() == Global.zero_address(),

            Txn.application_args.length() == Int(6),

            check_local_variables(Txn.sender())
        )
    )

    @Subroutine(TealType.none)
    def issue_certificate():
        return Seq(
           
            perform_checks_for_issuing,
                    
            App.localPut(Txn.sender(), local_certificate_id, Txn.application_args[1]),
            App.localPut(Txn.sender(), local_student_id, Txn.application_args[2]),
            App.localPut(Txn.sender(), local_student_full_name, Txn.application_args[3]),
            App.localPut(Txn.sender(), local_issue_date, Txn.application_args[4]),
            App.localPut(Txn.sender(), local_certificate_cid, Txn.application_args[5]),

            Approve()
        )
    
    @Subroutine(TealType.uint64)
    def check_verification_fee(fee: Expr):
        return Return(
            fee == Int(50000)
        )
    
    perform_checks_for_verification = Assert(
        And(
            Global.group_size() == Int(2),

            Txn.group_index() == Int(0), 
            Gtxn[1].type_enum() == TxnType.Payment,
            Gtxn[1].receiver() == Global.current_application_address(), 
            Gtxn[0].rekey_to() == Global.zero_address(),
            Gtxn[1].rekey_to() == Global.zero_address(),

            App.optedIn(Txn.accounts[1], Global.current_application_id()),
            
            Txn.application_args.length() == Int(2),

            check_verification_fee(Gtxn[1].amount()),

            check_local_variables(Txn.sender()),
        )
    )

    @Subroutine(TealType.none)
    def transfer_fee(account: Expr, fee: Expr):
        return Seq(
            InnerTxnBuilder.Begin(),

            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: account,
                TxnField.amount: fee
            }),

            InnerTxnBuilder.Submit()
        )

    @Subroutine(TealType.none)
    def check_if_valid(provided_cid: Expr, stored_cid: Expr):
        return Seq(
            If(
                stored_cid == provided_cid
            )
            .Then(
                App.localPut(Txn.sender(), local_verification_result, Bytes("valid"))
            )
            .Else(
                App.localPut(Txn.sender(), local_verification_result, Bytes("invalid"))
            ),
            transfer_fee(Txn.accounts[1], Gtxn[1].amount())
        )

    @Subroutine(TealType.none)
    def verify_certificate():
        return Seq(

            perform_checks_for_verification,
            
            App.localPut(Txn.sender(), local_certificate_cid, Txn.application_args[1]),
            App.localPut(Txn.sender(), local_verification_fee, Gtxn[1].amount()),

            check_if_valid(App.localGet(Txn.sender(), local_certificate_cid), App.localGet(Txn.accounts[1], local_certificate_cid)),

            Approve()
        )

    return program.event(
        init= Approve(),

        opt_in= Seq(
        get_ready(Txn.sender()),
        Approve()
        ),

        no_op= Seq(
            Cond(
                [Txn.application_args[0] == op_issue, issue_certificate()],
                [Txn.application_args[0] == op_verify, verify_certificate()]
            ),
            Reject()
        )
    )

def clear():
    return Approve()